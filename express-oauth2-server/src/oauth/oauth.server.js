// src/oauth/oauth.server.js
const OAuthServer = require('express-oauth-server');
const oauthModel = require('./oauth.model');
const envConfig = require('../config/env');

const oauth = new OAuthServer({
  model: oauthModel,
  accessTokenLifetime: envConfig.ACCESS_TOKEN_LIFETIME, // In seconds (e.g., 3600 for 1 hour)
  refreshTokenLifetime: envConfig.REFRESH_TOKEN_LIFETIME, // In seconds (e.g., 86400 for 1 day)
  allowBearerTokensInQueryString: false, // For security, don't allow tokens in query string
  allowEmptyState: true, // For authorization_code grant
  // addAcceptedGrantTypes: ['password', 'refresh_token'], // If you want to explicitly list them, though model usually defines client grants
  
  // For Password Grant - customize username and password fields if different from 'username' and 'password'
  // passwordUserFields: ['username', 'email'], // Example if user can login with username or email

  // For Refresh Token Grant
  alwaysIssueNewRefreshToken: true, // Recommended: issue a new refresh token when the old one is used

  // For Authorization Code Grant (if implemented)
  // authorizationCodeLifetime: 300, // 5 minutes
});

module.exports = { oauth }; // Export the configured server instance