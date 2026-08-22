/**
 * Standard API Response Helper
 * Ensures uniform response structure: { success, data, error, message }
 */

export const sendSuccess = (
  res,
  { statusCode = 200, data = null, message = 'Success' } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    message,
  });
};

export const sendError = (
  res,
  { statusCode = 500, error = null, message = 'An error occurred' } = {}
) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: error || message,
    message,
  });
};
