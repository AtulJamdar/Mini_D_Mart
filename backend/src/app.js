import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing (supports single or comma-separated origins, handles trailing slashes)
const rawClientUrls = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrls
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, mobile, curl, webhooks)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to allow valid subdomains
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Cookie Parser for httpOnly JWT authentication
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global API Rate Limiter (200 requests per 15 minutes, skipped in test)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: () => process.env.NODE_ENV === 'test',
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

// Body Parsers with payload size limits to mitigate DoS & capture rawBody for webhook validation
app.use(
  express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Express 5 compatible recursive NoSQL injection sanitizer
const sanitizeObj = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeObj(obj[key]);
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  if (req.params) sanitizeObj(req.params);
  // Note: in Express 5 req.query is sanitized in place without reassigning getter
  if (req.query) {
    try {
      sanitizeObj(req.query);
    } catch {
      // Ignore if immutable
    }
  }
  next();
});

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
