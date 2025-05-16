const { OAuthUser } = require('../models');
const { UniqueConstraintError } = require('sequelize');

/**
 * Registers a new user.
 * @param {Object} userData - User data (username, email, password, name).
 * @returns {Promise<Object>} The created user object (without password).
 * @throws {Error} If user creation fails or data is conflicting.
 */
async function signupUser(userData) {
  try {
    const { username, email, password, name } = userData;

    // The model hook (beforeCreate) in OAuthUser will hash the password.
    const newUser = await OAuthUser.create({
      username,
      email,
      password, // Plain text password, hook will hash it
      name,
      isActive: true, // Or implement an email verification step before activating
    });

    // Return user data without the password hash
    const userJson = newUser.toJSON();
    delete userJson.password;
    delete userJson.isActive; // Or include it if client needs it

    return userJson;

  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      // This error is usually caught by custom validators now, but good as a fallback
      const field = error.errors[0].path;
      const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use.`;
      const err = new Error(message);
      err.status = 409; // Conflict
      throw err;
    }
    // Log the original error for debugging
    console.error('Error during user signup in service:', error);
    // Throw a more generic error to the controller
    const serviceError = new Error('Could not register user at this time.');
    serviceError.status = 500;
    throw serviceError;
  }
}

module.exports = {
  signupUser,
};