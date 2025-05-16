// __tests__/oauth.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app'); // Your Express app instance
const { sequelize, OAuthUser, OAuthClient, OAuthToken } = require('../src/models');

// --- Test Data ---
const testUserPassword = 'Str0ngPassword!';
const testClientSecret = 'SuperS3cr3tClient!';
let testUser;
let testClient;
let testUserHashedPassword;
let testClientHashedSecret;

// --- Helper Functions ---
async function clearDatabase() {
  // Order matters due to foreign key constraints
  await OAuthToken.destroy({ where: {}, truncate: true, cascade: true });
  await OAuthClient.destroy({ where: {}, truncate: true, cascade: true });
  await OAuthUser.destroy({ where: {}, truncate: true, cascade: true });
}

async function seedDatabase() {
    // testUserHashedPassword = await bcrypt.hash(testUserPassword, 10); // REMOVE THIS LINE or comment out
  
    testUser = await OAuthUser.create({
      username: 'testuser@example.com',
      password: testUserPassword, // PROVIDE PLAIN TEXT PASSWORD HERE
      email: 'testuser@example.com',
      name: 'Test User',
      isActive: true,
    });
  
    testClient = await OAuthClient.create({
      clientId: 'test-client-id',
      clientSecret: testClientSecret, // Keep this as plain text from previous fix
      clientName: 'Test Client Application',
      redirectUris: ['http://localhost:8080/callback'],
      grants: ['password', 'refresh_token'],
      userId: testUser.id,
    });
  }

// --- Jest Hooks ---
beforeAll(async () => {
  // Ensure NODE_ENV is test
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV must be set to test for running tests.');
  }
  // Sync database (creates tables if they don't exist in the test DB)
  // In a real CI, migrations would run first. For local, sync can be okay.
  await sequelize.sync({ force: true }); // force: true will drop and recreate tables
  console.log('Test database synced.');
});

beforeEach(async () => {
  await clearDatabase();
  await seedDatabase();
});

afterAll(async () => {
  await clearDatabase(); // Clean up after all tests
  await sequelize.close(); // Close database connection
  console.log('Test database connection closed.');
});

// --- Test Suites ---
describe('OAuth Endpoints', () => {
  describe('POST /oauth/token - Password Grant', () => {
    it('should return an access token and refresh token for valid credentials', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          username: testUser.username,
          password: testUserPassword, // Use plain text password here
          client_id: testClient.clientId,
          client_secret: testClientSecret, // Use plain text secret here
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('token_type', 'Bearer');
      expect(response.body).toHaveProperty('expires_in');
    });

    it('should return 400 for invalid grant_type', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'invalid_grant',
          username: testUser.username,
          password: testUserPassword,
          client_id: testClient.clientId,
          client_secret: testClientSecret,
        });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_request'); // From our inputValidator
    });

    it('should return 400 if username is missing for password grant', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            grant_type: 'password',
            // username: testUser.username, // Missing
            password: testUserPassword,
            client_id: testClient.clientId,
            client_secret: testClientSecret,
          });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
        expect(response.body.error_description).toContain('username is required');
      });

    it('should return 401 (or error from OAuth library) for invalid user credentials', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          username: testUser.username,
          password: 'wrongpassword',
          client_id: testClient.clientId,
          client_secret: testClientSecret,
        });
      // The express-oauth-server usually returns 400 with 'invalid_grant' for bad user creds
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_grant');
      expect(response.body.error_description).toBe('Invalid grant: user credentials are invalid');
    });

    it('should return 401 (or error from OAuth library) for invalid client credentials', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          username: testUser.username,
          password: testUserPassword,
          client_id: testClient.clientId,
          client_secret: 'wrongclientsecret',
        });
      // The express-oauth-server usually returns 401 with 'invalid_client'
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid_client');
      expect(response.body.error_description).toBe('Invalid client: client is invalid');
    });
  });

  describe('POST /oauth/token - Refresh Token Grant', () => {
    let initialAccessToken;
    let initialRefreshToken;

    beforeEach(async () => {
      // Get an initial token set using password grant
      const tokenResponse = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          username: testUser.username,
          password: testUserPassword,
          client_id: testClient.clientId,
          client_secret: testClientSecret,
        });
      initialAccessToken = tokenResponse.body.access_token;
      initialRefreshToken = tokenResponse.body.refresh_token;
    });

    it('should return a new access token and refresh token for a valid refresh token', async () => {
      expect(initialRefreshToken).toBeDefined();

      const response = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'refresh_token',
          refresh_token: initialRefreshToken,
          client_id: testClient.clientId,
          client_secret: testClientSecret, // Refresh token grant often requires client auth
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).not.toBe(initialAccessToken); // New access token
      expect(response.body).toHaveProperty('refresh_token');
      // If alwaysIssueNewRefreshToken is true (recommended), the refresh token should also be new
      // For some library versions or configurations, it might re-issue the same refresh token. Adjust test if needed.
      if (process.env.ALWAYS_ISSUE_NEW_REFRESH_TOKEN !== 'false') { // Assuming your server config for this
          expect(response.body.refresh_token).not.toBe(initialRefreshToken);
      }
      expect(response.body).toHaveProperty('token_type', 'Bearer');
    });

    it('should return 400 (or error from lib) if refresh_token is missing', async () => {
        const response = await request(app)
          .post('/oauth/token')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            grant_type: 'refresh_token',
            // refresh_token: initialRefreshToken, // Missing
            client_id: testClient.clientId,
            client_secret: testClientSecret,
          });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error', 'invalid_request');
      });


    it('should return 400 (or error from lib) for an invalid/revoked refresh token', async () => {
      // First, use the refresh token to get a new set (which should revoke the old one if configured)
      if (process.env.ALWAYS_ISSUE_NEW_REFRESH_TOKEN !== 'false') {
        await request(app)
          .post('/oauth/token')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            grant_type: 'refresh_token',
            refresh_token: initialRefreshToken,
            client_id: testClient.clientId,
            client_secret: testClientSecret,
          });
      }


      const response = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'refresh_token',
          refresh_token: initialRefreshToken, // Using the (potentially) old/revoked refresh token
          client_id: testClient.clientId,
          client_secret: testClientSecret,
        });

      expect(response.statusCode).toBe(400); // Or 401 depending on library behavior for invalid refresh tokens
      expect(response.body).toHaveProperty('error', 'invalid_grant');
      expect(response.body.error_description).toBe('Invalid grant: refresh token is invalid');
    });
  });

  describe('GET /oauth/me (Protected Endpoint)', () => {
    let accessToken;

    beforeEach(async () => {
      const tokenResponse = await request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          username: testUser.username,
          password: testUserPassword,
          client_id: testClient.clientId,
          client_secret: testClientSecret,
        });
      accessToken = tokenResponse.body.access_token;
    });

    it('should return user, client, and scope information for a valid access token', async () => {
      expect(accessToken).toBeDefined();
      const response = await request(app)
        .get('/oauth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'You have accessed a protected resource!');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body).toHaveProperty('client');
      expect(response.body.client.clientId).toBe(testClient.clientId);
      // expect(response.body).toHaveProperty('scope'); // Check if scope was requested/granted
    });

    it('should return 401 if no access token is provided', async () => {
        const response = await request(app).get('/oauth/me');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({}); // Expect an empty object
    });

    it('should return 401 if an invalid access token is provided', async () => {
      const response = await request(app)
        .get('/oauth/me')
        .set('Authorization', 'Bearer invalidtoken123');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_token'); // ADJUSTED
    });

    it('should return 401 if an expired access token is provided', async () => {
      // To test this properly, you'd need to:
      // 1. Generate a token.
      // 2. Manually update its `accessTokenExpiresAt` in the DB to a past date.
      // 3. Try to use it.
      // This is more involved. For now, we can skip this direct test or mock time.

      // Simulate an expired token by creating one with a past expiry
      const expiredToken = await OAuthToken.create({
        accessToken: 'expiredaccesstoken',
        accessTokenExpiresAt: new Date(Date.now() - (2 * 3600 * 1000)), // 2 hours ago
        clientId: testClient.id, // DB ID
        userId: testUser.id,     // DB ID
      });

      const response = await request(app)
        .get('/oauth/me')
        .set('Authorization', `Bearer ${expiredToken.accessToken}`);

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('error', 'invalid_token'); // ADJUSTED
        expect(response.body.error_description).toBe('Invalid token: access token is invalid');
    });
  });
});