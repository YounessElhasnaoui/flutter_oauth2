
const authService = require('../services/auth.service');

async function signup(req, res, next) {
  try {
    const userData = req.body;
    const newUser = await authService.signupUser(userData);
    res.status(201).json({
      message: 'User registered successfully!',
      user: newUser,
    });
  } catch (error) {
    // If service layer explicitly sets a status on the error, use it
    if (error.status) {
        return res.status(error.status).json({
            error: error.name || 'SignupError', // Use error.name if available
            message: error.message
        });
    }
    // Otherwise, pass to global error handler for unexpected errors
    next(error);
  }
}
module.exports = { signup };