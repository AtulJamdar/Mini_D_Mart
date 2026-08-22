/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler Middleware
 * Suppresses internal stack traces in production to prevent information disclosure.
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Generic sanitized error message for 500 internal errors in production
  let userMessage = err.message || 'Internal Server Error';
  if (isProduction && statusCode === 500) {
    userMessage = 'An unexpected server error occurred. Please contact support.';
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: isProduction ? userMessage : err.message || 'Internal Server Error',
    message: userMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
