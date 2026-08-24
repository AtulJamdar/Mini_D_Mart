import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import otpService from '../services/otpService.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import {
  signToken,
  getCookieOptions,
  normalizePhone,
  generateOtp,
  formatUserResponse,
} from '../utils/authHelper.js';

/**
 * Request OTP for phone authentication
 * POST /api/auth/otp/request
 */
export const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return sendError(res, {
        statusCode: 400,
        message: 'Please provide a valid 10-digit phone number.',
      });
    }

    const existingUser = await User.findOne({ phone: cleanPhone });
    const isNewUser = !existingUser;

    const otpLength = parseInt(process.env.OTP_LENGTH, 10) || 6;
    const otp = generateOtp(otpLength);
    const otpHash = await bcrypt.hash(otp, 10);

    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Upsert OTP record for this phone, resetting attempts and updating expiry
    await Otp.findOneAndUpdate(
      { phone: cleanPhone },
      { otpHash, attempts: 0, expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    // Log DEV OTP or dispatch SMS
    await otpService.sendOtp(cleanPhone, otp);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'OTP sent successfully.',
      data: {
        phone: cleanPhone,
        isNewUser,
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to request OTP.',
      error: error.message,
    });
  }
};

/**
 * Verify OTP and login or register customer
 * POST /api/auth/otp/verify
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, firstName, lastName } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return sendError(res, {
        statusCode: 400,
        message: 'Please provide a valid 10-digit phone number.',
      });
    }

    if (!otp || String(otp).trim().length === 0) {
      return sendError(res, {
        statusCode: 400,
        message: 'Please provide the OTP.',
      });
    }

    const otpDoc = await Otp.findOne({ phone: cleanPhone });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      if (otpDoc) {
        await Otp.deleteOne({ _id: otpDoc._id });
      }
      return sendError(res, {
        statusCode: 400,
        message: 'OTP has expired or is invalid. Please request a new OTP.',
      });
    }

    if (otpDoc.attempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return sendError(res, {
        statusCode: 400,
        message: 'Maximum verification attempts exceeded (5). Please request a fresh OTP.',
      });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = 5 - otpDoc.attempts;

      if (remaining <= 0) {
        await Otp.deleteOne({ _id: otpDoc._id });
        return sendError(res, {
          statusCode: 400,
          message: 'Maximum verification attempts exceeded (5). Please request a fresh OTP.',
        });
      }

      return sendError(res, {
        statusCode: 400,
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // OTP matched successfully: clear the OTP record to prevent replay
    await Otp.deleteOne({ _id: otpDoc._id });

    let user = await User.findOne({ phone: cleanPhone });

    if (user) {
      if (!user.isActive) {
        await AuditLoggerService.logLoginAttempt({
          phone: cleanPhone,
          userId: user._id,
          success: false,
          req,
          reason: 'User account deactivated',
        });

        return sendError(res, {
          statusCode: 403,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      await AuditLoggerService.logLoginAttempt({
        phone: cleanPhone,
        userId: user._id,
        success: true,
        req,
        reason: 'OTP authenticated successfully',
      });
    } else {
      // Create new customer account with role hardcoded to customer
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || `Customer_${cleanPhone.slice(-4)}`;
      user = await User.create({
        name: fullName,
        phone: cleanPhone,
        role: 'customer',
        isActive: true,
      });

      await AuditLoggerService.logLoginAttempt({
        phone: cleanPhone,
        userId: user._id,
        success: true,
        req,
        reason: 'Customer registered via OTP successfully',
      });
    }

    const token = signToken(user._id, user.role);
    res.cookie('token', token, getCookieOptions());

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Authentication successful.',
      data: {
        token,
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'OTP verification failed.',
      error: error.message,
    });
  }
};
