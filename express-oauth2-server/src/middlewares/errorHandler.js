// src/middlewares/errorHandler.js
const envConfig = require('../config/env');
const { BaseError, ValidationError, UniqueConstraintError } = require('sequelize'); // For specific Sequelize errors
const winston = require('winston'); // We'll configure this logger later

// Basic logger setup for now (can be moved to a dedicated logger config file)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

if (envConfig.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}


// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack); // Log the full stack trace

  // Handle express-oauth-server errors (often have status and specific names)
  // Common names: OAuth2Error, InvalidArgumentError, InvalidGrantError, InvalidRequestError, etc.
  // The library often sets err.statusCode or err.status
  if (err.name && err.name.includes('OAuth') && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name,
      error_description: err.message,
    });
  }
  // More specific OAuth errors from the underlying 'oauth2-server' library
  if (err.name === 'UnauthorizedRequestError') {
    return res.status(err.code || 401).json({ error: err.name, error_description: err.message });
  }
  if (err.name === 'InvalidTokenError') {
    return res.status(err.code || 401).json({ error: err.name, error_description: err.message });
  }


  // Handle Sequelize Validation Errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      messages: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  // Handle Sequelize Unique Constraint Errors
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ // 409 Conflict
      error: 'Conflict Error',
      messages: err.errors.map(e => ({
        message: `The value for ${e.path} ('${e.value}') is already in use.`,
        field: e.path,
      })),
    });
  }

  // Handle other Sequelize Base Errors
  if (err instanceof BaseError) {
    return res.status(500).json({
      error: 'Database Error',
      message: envConfig.NODE_ENV === 'development' ? err.message : 'A database error occurred.',
    });
  }

  // Generic error handling
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: (envConfig.NODE_ENV === 'development' || err.expose) ? err.message : 'An unexpected error occurred on the server.',
    ...(envConfig.NODE_ENV === 'development' && { stack: err.stack }), // Include stack in dev
  });
}

module.exports = errorHandler;