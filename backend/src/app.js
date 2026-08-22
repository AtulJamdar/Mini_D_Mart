import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Cookie Parser
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global General Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Too many requests from this IP, please try again after 15 minutes',
    message: 'Too many requests',
  },
});
app.use('/api', generalLimiter);

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// API Routes
app.use('/api', apiRouter);

// Root fallback route
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Mini D-Mart API Server',
      version: '1.0.0',
      status: 'online',
    },
    error: null,
    message: 'Mini D-Mart API root',
  });
});

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
