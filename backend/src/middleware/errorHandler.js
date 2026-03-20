const logger = require('../config/logger');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    user: req.user?.id,
  });

  if (err.message && err.message.includes('OAuth')) {
    return errorResponse(res, err.message, 401);
  }

  // Postgres errors
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    return errorResponse(res, `${field} already exists`, 409);
  }
  if (err.code === '23503') {
    return errorResponse(res, 'Referenced resource not found', 400);
  }
  if (err.code === '22P02') {
    return errorResponse(res, 'Invalid UUID format', 400);
  }

  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? statusCode === 500 ? 'Internal server error' : err.message
    : err.message;

  return errorResponse(res, message, statusCode);
};

const notFound = (req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

module.exports = { errorHandler, notFound };
