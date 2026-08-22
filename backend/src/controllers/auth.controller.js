import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';

/**
 * Generate JWT access token
 */
const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Configure cookie options for JWT
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour in ms
  };
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return sendError(res, {
        statusCode: 409,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password with 12 rounds
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      phone,
      role: role || 'customer',
    });

    const token = signToken(newUser._id, newUser.role);

    // Set httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    const userObj = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
    };

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Registration successful.',
      data: {
        token,
        user: userObj,
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Registration failed.',
      error: error.message,
    });
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Audit log failed attempt
      await AuditLoggerService.logLoginAttempt({
        email: normalizedEmail,
        success: false,
        req,
        reason: 'User email not found',
      });

      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      // Audit log failed attempt
      await AuditLoggerService.logLoginAttempt({
        email: normalizedEmail,
        userId: user._id,
        success: false,
        req,
        reason: 'Incorrect password',
      });

      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    // Audit log successful attempt
    await AuditLoggerService.logLoginAttempt({
      email: normalizedEmail,
      userId: user._id,
      success: true,
      req,
      reason: 'Authenticated successfully',
    });

    const token = signToken(user._id, user.role);

    // Set httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    const userObj = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      addresses: user.addresses,
      createdAt: user.createdAt,
    };

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful.',
      data: {
        token,
        user: userObj,
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
