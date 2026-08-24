import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import {
  signToken,
  getCookieOptions,
  formatUserResponse,
} from '../utils/authHelper.js';

export { requestOtp, verifyOtp } from './otpAuth.controller.js';

/**
 * Log in an existing user (Staff, Manager, Admin)
 * POST /api/auth/login
 * Prevents account enumeration by returning identical generic error messages.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive) {
      await AuditLoggerService.logLoginAttempt({
        email: normalizedEmail,
        success: false,
        req,
        reason: !user ? 'User email not found' : 'User account deactivated',
      });

      // Generic message to prevent user enumeration
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await AuditLoggerService.logLoginAttempt({
        email: normalizedEmail,
        userId: user._id,
        success: false,
        req,
        reason: 'Incorrect password',
      });

      // Generic message to prevent user enumeration
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    await AuditLoggerService.logLoginAttempt({
      email: normalizedEmail,
      userId: user._id,
      success: true,
      req,
      reason: 'Authenticated successfully',
    });

    const token = signToken(user._id, user.role);
    res.cookie('token', token, getCookieOptions());

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful.',
      data: {
        token, // Included for API testing tools
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Login failed due to an unexpected error.',
      error: error.message,
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'User profile retrieved.',
    data: {
      user: req.user,
    },
  });
};

/**
 * Update authenticated user's profile
 * PATCH /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  const { name, firstName, lastName, email } = req.body;
  const user = req.user;

  try {
    if (firstName || lastName) {
      const parts = [firstName, lastName].filter(Boolean);
      user.name = parts.join(' ').trim();
    } else if (name) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      user.email = email ? email.toLowerCase().trim() : undefined;
    }

    await user.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Profile updated successfully.',
      data: {
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, {
        statusCode: 409,
        message: 'This email address is already in use by another account.',
      });
    }
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

/**
 * Update authenticated user's lightweight preferred delivery location
 * PATCH /api/auth/location
 */
export const updatePreferredLocation = async (req, res) => {
  const { label, pincode, city, lat, lng } = req.body;
  const user = req.user;

  try {
    user.preferredLocation = {
      label: label ? label.trim() : user.preferredLocation?.label || '',
      pincode: pincode ? pincode.toString().trim() : user.preferredLocation?.pincode || '',
      city: city ? city.trim() : user.preferredLocation?.city || '',
      lat: typeof lat === 'number' ? lat : user.preferredLocation?.lat,
      lng: typeof lng === 'number' ? lng : user.preferredLocation?.lng,
    };

    await user.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Preferred delivery location updated successfully.',
      data: {
        preferredLocation: user.preferredLocation,
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to update preferred location.',
      error: error.message,
    });
  }
};

export { addAddress, deleteAddress } from './address.controller.js';

/**
 * Delete / Deactivate current user account
 * DELETE /api/auth/account
 */
export const deleteAccount = async (req, res) => {
  const user = req.user;

  try {
    user.isActive = false;
    await user.save();

    res.clearCookie('token', getCookieOptions());

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Your account has been deleted / deactivated.',
      data: null,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to delete account.',
      error: error.message,
    });
  }
};

/**
 * Log out user (clear auth cookie)
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.clearCookie('token', getCookieOptions());
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Logged out successfully.',
    data: null,
  });
};
