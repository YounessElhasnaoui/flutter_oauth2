// src/middlewares/inputValidator.js
const { validationResult } = require('express-validator');

const inputValidator = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    console.log(`InputValidator for path: ${req.path}`); // Log path
    console.log('Validation errors object:', JSON.stringify(errors, null, 2)); // Log the whole errors object
    const errorsArray = errors.array();
    console.log('Validation errors array:', JSON.stringify(errorsArray, null, 2)); // Log the errors array

    if (req.path === '/token' || req.path === '/oauth/token') {
        const firstError = errorsArray.length > 0 ? errorsArray[0] : { msg: 'Unknown validation error' };
        return res.status(400).json({
            error: 'invalid_request',
            error_description: firstError.msg,
        });
    }

    // For other routes (like /auth/signup)
    const responsePayload = {
      error: 'Validation Error',
      messages: errorsArray.map(e => ({ field: e.path, message: e.msg })),
    };
    console.log('Signup error response payload:', JSON.stringify(responsePayload, null, 2));
    res.status(400).json(responsePayload);
  };
};

module.exports = inputValidator;