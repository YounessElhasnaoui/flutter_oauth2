const express = require('express');
const authController = require('../controllers/auth.controller');
const inputValidator = require('../middlewares/inputValidator');
const { signupValidationRules } = require('../validators/auth.validator');

const router = express.Router();

// POST /auth/signup - User Registration
router.post(
  '/signup',
  inputValidator(signupValidationRules()), // Apply validation rules
  authController.signup
);

// Login is typically POST /oauth/token (handled by oauth.routes.js)

module.exports = router;