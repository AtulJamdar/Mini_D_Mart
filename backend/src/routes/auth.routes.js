import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { sendError } from '../utils/responseHelper.js';

const authRouter = Router();

// Dedicated rate limiter for authentication endpoints: max 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
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
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['customer', 'store_staff', 'store_manager', 'admin'])
    .withMessage('Invalid role specified'),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Mount Routes with rate limiting
authRouter.use(authLimiter);

authRouter.post('/register', registerValidation, register);
authRouter.post('/login', loginValidation, login);
authRouter.get('/me', authenticate, getMe);
authRouter.post('/logout', authenticate, logout);

export default authRouter;
