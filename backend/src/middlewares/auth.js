import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/responseHelper.js';

/**
 * Authentication Middleware
 * Extracts and verifies JWT from Authorization header or httpOnly cookie,
 * loads user and attaches to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // 2. Fallback to httpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required. No token provided.',
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid token. Please authenticate again.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, {
        statusCode: 401,
        message: 'Your token has expired. Please log in again.',
      });
    }

    return sendError(res, {
      statusCode: 500,
      message: 'Failed to authenticate user.',
      error: error.message,
    });
  }
};

export default authenticate;
