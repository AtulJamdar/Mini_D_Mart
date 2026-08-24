import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import {
  login,
  getMe,
  logout,
  requestOtp,
  verifyOtp,
  updateProfile,
  updatePreferredLocation,
  addAddress,
  deleteAddress,
  deleteAccount,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { sendError } from '../utils/responseHelper.js';

const authRouter = Router();

// Dedicated rate limiter for authentication endpoints: max 20 requests per 15 minutes (skipped in test)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    message: 'Rate limit exceeded.',
  },
});

// Middleware to validate express-validator results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      error: errors.array().map((e) => e.msg).join(', '),
    });
  }
  next();
};

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const otpRequestValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((val) => {
      const clean = val.toString().replace(/\D/g, '').slice(-10);
      if (clean.length !== 10) {
        throw new Error('Please provide a valid 10-digit phone number');
      }
      return true;
    }),
  validate,
];

const otpVerifyValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required'),
  validate,
];

// Mount Routes with rate limiting
authRouter.use(authLimiter);

authRouter.post('/login', loginValidation, login);
authRouter.post('/otp/request', otpRequestValidation, requestOtp);
authRouter.post('/otp/verify', otpVerifyValidation, verifyOtp);
authRouter.get('/me', authenticate, getMe);
authRouter.patch('/profile', authenticate, updateProfile);
authRouter.patch('/location', authenticate, updatePreferredLocation);
authRouter.post('/addresses', authenticate, addAddress);
authRouter.delete('/addresses/:id', authenticate, deleteAddress);
authRouter.delete('/account', authenticate, deleteAccount);
authRouter.post('/logout', authenticate, logout);

export default authRouter;
