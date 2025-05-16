// src/validators/auth.validator.js
const { body } = require('express-validator');
// const { OAuthUser } = require('../models'); // No longer needed here

const signupValidationRules = () => {
  return [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required.')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
      // .custom(async (value) => { ... REMOVED ... }), // REMOVED
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(),
      // .custom(async (value) => { ... REMOVED ... }), // REMOVED
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long if provided.'),
  ];
};
module.exports = { signupValidationRules };