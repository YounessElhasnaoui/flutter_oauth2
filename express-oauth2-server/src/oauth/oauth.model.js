// src/oauth/oauth.model.js
const { OAuthUser, OAuthClient, OAuthToken } = require('../models'); // Adjust path if your models/index.js exports differently
const envConfig = require('../config/env'); // For token lifetimes
const { Op } = require("sequelize");

// --- Helper function (optional but good for consistency) ---
function formatToken(tokenInstance, clientInstance, userInstance) {
  if (!tokenInstance) return null;

  const token = tokenInstance.toJSON(); // Get plain object
  return {
    accessToken: token.accessToken,
    accessTokenExpiresAt: new Date(token.accessTokenExpiresAt), // Ensure it's a Date object
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshToken ? new Date(token.refreshTokenExpiresAt) : undefined,
    scope: token.scope, // or parse if it's an array stored as string
    client: clientInstance.toJSON(), // Client object
    user: userInstance.toJSON(), // User object
  };
}


module.exports = {
  /**
   * Get access token.
   */
  getAccessToken: async (bearerToken) => {
    console.log('[OAuthModel] getAccessToken called with token:', bearerToken);
    try {
      const tokenInstance = await OAuthToken.findOne({
        where: { accessToken: bearerToken },
        include: [
          { model: OAuthClient, as: 'client' },
          { model: OAuthUser, as: 'user' },
        ],
      });

      if (!tokenInstance) {
        console.log('[OAuthModel] getAccessToken: Token not found');
        return null;
      }

      if (new Date(tokenInstance.accessTokenExpiresAt) < new Date()) {
        console.log('[OAuthModel] getAccessToken: Token expired');
        // Optionally, revoke the expired token here
        // await tokenInstance.destroy();
        return null;
      }

      return formatToken(tokenInstance, tokenInstance.client, tokenInstance.user);
    } catch (error) {
      console.error('[OAuthModel] Error in getAccessToken:', error);
      return null; // Or throw error if the library expects it
    }
  },

  /**
   * Get client.
   */
  getClient: async (clientIdString, clientSecret) => {
    console.log(`[OAuthModel] getClient called with clientId: ${clientIdString}, clientSecret provided: ${!!clientSecret}`);
    try {
        const clientInstance = await OAuthClient.findOne({ where: { clientId: clientIdString } }); // Find by string clientId

        if (!clientInstance) {
        console.log('[OAuthModel] getClient: Client not found');
        return null;
      }

      // If clientSecret is null, this is a public client or a grant type
      // that doesn't require a secret (e.g., authorization_code with PKCE).
      // The library will often call getClient without a secret first.
      if (clientSecret === null || clientSecret === undefined) {
        // For public clients, you might have a flag on the client model, e.g., `isPublic: true`
        // For now, we assume if no secret is passed, and client exists, it's okay for some flows.
        // Or, you might require specific grant types for clients without secrets.
        console.log('[OAuthModel] getClient: No client secret provided, returning client for potential public use or PKCE');
      } else {
        // If a clientSecret is provided, validate it
        const isValid = await clientInstance.isValidSecret(clientSecret);
        if (!isValid) {
          console.log('[OAuthModel] getClient: Invalid client secret');
          return null;
        }
        console.log('[OAuthModel] getClient: Client secret is valid');
      }

      const clientData = clientInstance.toJSON();
        return {
            id: clientData.id, // THIS IS THE INTEGER PRIMARY KEY from OAuthClients table
            clientId: clientData.clientId, // The public string identifier
            // clientSecret: clientData.clientSecret, // Generally not needed to be returned after validation for saveToken
            redirectUris: clientData.redirectUris,
            grants: clientData.grants,
            // ... any other properties the library needs for the client object
        };
    } catch (error) {
      console.error('[OAuthModel] Error in getClient:', error);
      return null;
    }
  },

  /**
   * Get refresh token.
   */
  getRefreshToken: async (bearerToken) => {
    console.log('[OAuthModel] getRefreshToken called with token:', bearerToken);
    try {
      const tokenInstance = await OAuthToken.findOne({
        where: { refreshToken: bearerToken },
        include: [
          { model: OAuthClient, as: 'client' },
          { model: OAuthUser, as: 'user' },
        ],
      });

      if (!tokenInstance) {
        console.log('[OAuthModel] getRefreshToken: Refresh token not found');
        return null;
      }

      if (new Date(tokenInstance.refreshTokenExpiresAt) < new Date()) {
        console.log('[OAuthModel] getRefreshToken: Refresh token expired');
        // Optionally, revoke the expired refresh token here
        // await tokenInstance.destroy();
        return null;
      }
      return formatToken(tokenInstance, tokenInstance.client, tokenInstance.user);
    } catch (error) {
      console.error('[OAuthModel] Error in getRefreshToken:', error);
      return null;
    }
  },

  /**
   * Get user.
   */
  getUser: async (usernameOrEmail, password) => { // Parameter name changed for clarity
    console.log(`[OAuthModel] getUser called for username/email: ${usernameOrEmail}`);
    try {
        const userInstance = await OAuthUser.findOne({
            where: {
                [Op.or]: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ],
                isActive: true
            }
        });

        if (!userInstance) {
            console.log('[OAuthModel] getUser: User not found by username or email');
            return null;
        }

        const isValid = await userInstance.isValidPassword(password);
        if (!isValid) {
            console.log('[OAuthModel] getUser: Invalid password');
            return null;
        }

        console.log('[OAuthModel] getUser: User authenticated successfully');
        return userInstance.toJSON();
    } catch (error) {
        console.error('[OAuthModel] Error in getUser:', error);
        return null;
    }
},

  /**
   * Save token.
   */
  saveToken: async (token, client, user) => {
    // `client` here is the object returned by `getClient`
    // `user` here is the object returned by `getUser`
    console.log('[OAuthModel] saveToken called');
    console.log('[OAuthModel] saveToken - client.id (should be integer PK):', client.id, typeof client.id);
    console.log('[OAuthModel] saveToken - user.id (should be integer PK):', user.id, typeof user.id);
    try {

        // Ensure client.id and user.id are indeed the integer PKs
      if (typeof client.id !== 'number' || typeof user.id !== 'number') {
        console.error('[OAuthModel] saveToken: client.id or user.id is not a number! Client:', client, 'User:', user);
        // This indicates a problem with what getClient or getUser is returning.
        return null; // or throw an error
    }
      // Check if a token with this access token already exists (should be rare with good generation)
      // This also helps if you have unique constraints and want to handle potential collisions gracefully.
      // However, the library usually generates unique tokens.
      await OAuthToken.destroy({
        where: {
            userId: user.id,
            clientId: client.id, // This should now be the integer PK
        }
      });


      const tokenToSave = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt, // Should be a Date object
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt, // Should be a Date object
        scope: Array.isArray(token.scope) ? token.scope.join(' ') : token.scope, // Store scope as space-separated string if array
        clientId: client.id, // This should now be the integer PK
        userId: user.id,     // This should be the internal DB ID of the user
      };

      const savedTokenInstance = await OAuthToken.create(tokenToSave);
      console.log('[OAuthModel] saveToken: Token saved successfully');

      // The library expects the token, client, and user objects back
      const clientInstance = await OAuthClient.findByPk(client.id);
      const userInstance = await OAuthUser.findByPk(user.id);

      return formatToken(savedTokenInstance, clientInstance, userInstance);

    } catch (error) {
      console.error('[OAuthModel] Error in saveToken:', error);
      // Consider if you should throw the error to let the OAuth library handle it
      // e.g., if it's a unique constraint violation, the library might retry.
      // For now, returning null.
      return null;
    }
  },

  /**
   * Revoke token. (Called for refresh token grant type when a new refresh token is issued)
   * This is usually for revoking the *old* refresh token when a new one is generated.
   */
  revokeToken: async (token) => {
    // `token` here is the token object returned by `getRefreshToken`
    console.log('[OAuthModel] revokeToken called for refreshToken:', token.refreshToken);
    try {
      const result = await OAuthToken.destroy({ where: { refreshToken: token.refreshToken } });
      const success = result > 0; // `destroy` returns the number of rows deleted
      console.log(`[OAuthModel] revokeToken: Token revocation status: ${success}`);
      return success;
    } catch (error) {
      console.error('[OAuthModel] Error in revokeToken:', error);
      return false;
    }
  },

  // --- Optional methods, depending on grants you support ---

  /**
   * Verify scope.
   * This method is used to verify if the requested scope is valid for a particular client/user.
   * @param {Object} token - The token object.
   * @param {String|Array} scope - The scope(s) to verify.
   * @return {Boolean} - `true` if the scope is valid, `false` otherwise.
   */
  // validateScope: async (user, client, scope) => {
  //   console.log(`[OAuthModel] validateScope called for user ${user.id}, client ${client.id}, scope ${scope}`);
  //   // Example: ensure requested scope is a subset of client's allowed scopes or user's allowed scopes
  //   const clientAllowedScopes = (client.scope || '').split(' '); // Assuming client.scope is space-separated
  //   const requestedScopes = Array.isArray(scope) ? scope : (scope || '').split(' ');

  //   const isValid = requestedScopes.every(s => clientAllowedScopes.includes(s));
  //   if (!isValid) {
  //     console.log('[OAuthModel] validateScope: Invalid scope requested');
  //     return false; // or you can return the subset of valid scopes
  //   }
  //   console.log('[OAuthModel] validateScope: Scope is valid');
  //   return requestedScopes; // Return the validated (and possibly filtered) scopes
  // },

  /**
   * Verify scope. (Alternative name used by some versions of the library)
   * This method is used to verify if the access token has the required scope.
   * @param {Object} token - The token object (result of getAccessToken).
   * @param {String|Array} requiredScope - The scope(s) required for the resource.
   * @return {Boolean} - `true` if the token has the scope, `false` otherwise.
   */
  verifyScope: async (token, requiredScope) => {
    console.log(`[OAuthModel] verifyScope called for token with scope: ${token.scope}, required: ${requiredScope}`);
    if (!token.scope) {
      return false; // No scopes granted with this token
    }
    const grantedScopes = Array.isArray(token.scope) ? token.scope : token.scope.split(' ');
    const requiredScopes = Array.isArray(requiredScope) ? requiredScope : requiredScope.split(' ');

    const hasAllRequiredScopes = requiredScopes.every(s => grantedScopes.includes(s));
    console.log(`[OAuthModel] verifyScope: Has all required scopes: ${hasAllRequiredScopes}`);
    return hasAllRequiredScopes;
  },


  // --- Methods for Authorization Code Grant (if you implement it) ---
  // getAuthorizationCode: async (authorizationCode) => {
  //   // ... find and return authorization code from DB
  // },
  // saveAuthorizationCode: async (code, client, user) => {
  //   // ... save authorization code to DB
  // },
  // revokeAuthorizationCode: async (code) => {
  //   // ... delete/invalidate authorization code from DB
  // },
};