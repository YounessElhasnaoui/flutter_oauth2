// src/validators/oauth.validator.js
const { body } = require('express-validator');

const tokenValidationRules = () => {
  return [
    body('grant_type')
      .notEmpty().withMessage('grant_type is required.')
      .isIn(['password', 'refresh_token', 'client_credentials']) // Add 'authorization_code' if supported
      .withMessage('Invalid grant_type.'),

    // Conditional validation based on grant_type
    body('username').if(body('grant_type').equals('password'))
      .notEmpty().withMessage('username is required for password grant.'),
    body('password').if(body('grant_type').equals('password'))
      .notEmpty().withMessage('password is required for password grant.'),

    body('refresh_token').if(body('grant_type').equals('refresh_token'))
      .notEmpty().withMessage('refresh_token is required for refresh_token grant.'),

    body('client_id').notEmpty().withMessage('client_id is required.'),
    // client_secret might be optional for public clients or PKCE, but often required for token endpoint
    body('client_secret').if(body('grant_type').custom((value, { req }) => {
        // client_secret is not required for authorization_code with PKCE
        // for password and client_credentials, it depends on client confidentiality
        // for refresh_token, it might also be required if the client is confidential.
        // This is a simplified check; real logic depends on client type.
        // For now, let's assume it's required if the grant isn't specifically public-friendly.
        return req.body.grant_type !== 'some_public_grant_type'; // Adjust as needed
      }))
      .notEmpty().withMessage('client_secret is required for this grant type and client.'),

    body('scope').optional().isString().withMessage('scope must be a string.'),
  ];
};

module.exports = {
  tokenValidationRules,
};