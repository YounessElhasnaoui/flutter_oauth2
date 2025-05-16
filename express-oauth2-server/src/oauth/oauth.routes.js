// src/oauth/oauth.routes.js
const express = require('express');
const { oauth } = require('./oauth.server'); // Import the configured OAuth server instance
const inputValidator = require('../middlewares/inputValidator'); // We'll create this
const { tokenValidationRules } = require('../validators/oauth.validator'); // We'll create this

const router = express.Router();

// Token endpoint: handles password grant, refresh token grant, client credentials grant
router.post(
  '/token',
  inputValidator(tokenValidationRules()),  // Validate input before hitting OAuth logic
  oauth.token({
    // You can override some options here if needed, e.g.,
    // accessTokenLifetime: 7200
  })
);

// --- Authorization Code Grant Endpoints (Example, if you plan to support it) ---
// router.get('/authorize',
//   // TODO: Add middleware to ensure user is authenticated (e.g., session, redirect to login page)
//   (req, res, next) => {
//     // This is where you'd render an authorization page asking the user to approve/deny the client.
//     // For now, let's assume a simple consent screen logic or auto-approval for testing.
//     // If user is not logged in, redirect to a login page:
//     // if (!req.user) { return res.redirect(`/login?continue=${encodeURIComponent(req.originalUrl)}`); }
//     // next();
//     // For a real app, you'd render a view here.
//     // The `oauth.authorize()` middleware will handle the rest if it's a POST.
//     // For GET, you might prepare the form.
//     // This is a simplified placeholder:
//      if (!req.isAuthenticated || !req.isAuthenticated()) { // Replace with your actual auth check
//          return res.status(401).send('User not authenticated. Implement login and consent screen.');
//      }
//     next();
//   },
//   oauth.authorize({
//     authenticateHandler: { // Required for authorization_code grant
//       handle: (req, res) => {
//         // This function is called to get the authenticated user.
//         // It should return the user object or anything that your `saveAuthorizationCode` can use.
//         // Ensure `req.user` is populated by your primary authentication middleware (e.g., session)
//         return req.user; // Assuming req.user is populated by a login middleware
//       }
//     },
//     // allowEmptyState: true, // Already set in server config
//   })
// );

// // Handle the submission of the authorization form (POST to /authorize)
// router.post('/authorize',
//   (req, res, next) => {
//     // If user is not logged in, redirect to a login page
//     // if (!req.user) { return res.redirect(`/login?continue=${encodeURIComponent(req.originalUrl)}`); }
//     // This middleware is where you'd typically handle the user's decision (allow/deny)
//     // The `oauth.authorize()` will handle it if `authenticateHandler` is set.
//     // If user denies, you should redirect with error.
//     // If (req.body.decision === 'deny') { /* handle denial */ }
//      if (!req.isAuthenticated || !req.isAuthenticated()) { // Replace with your actual auth check
//          return res.status(401).send('User not authenticated. Implement login and consent screen.');
//      }
//     next();
//   },
//   oauth.authorize({
//     authenticateHandler: {
//       handle: (req, res) => {
//         return req.user;
//       }
//     }
//   })
// );

// Example of a protected route using the OAuth middleware
router.get('/me', oauth.authenticate(), (req, res) => {
  // req.user (or res.locals.oauth.token.user) contains the authenticated user from the token
  res.json({
    message: 'You have accessed a protected resource!',
    user: res.locals.oauth.token.user, // express-oauth-server populates this
    client: res.locals.oauth.token.client,
    scope: res.locals.oauth.token.scope,
  });
});

module.exports = router;