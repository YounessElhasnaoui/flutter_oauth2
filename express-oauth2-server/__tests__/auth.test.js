const request = require('supertest');
const app = require('../src/app');
const { sequelize, OAuthUser } = require('../src/models');

async function clearUsers() {
  await OAuthUser.destroy({ where: {}, truncate: true, cascade: true });
}

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('NODE_ENV must be set to test for running tests.');
    }
    await sequelize.sync({ force: true }); // Ensure clean tables for auth tests
  });

  beforeEach(async () => {
    await clearUsers(); // Clear users before each signup test
  });

  afterAll(async () => {
    await clearUsers();
    await sequelize.close();
  });

  describe('POST /auth/signup', () => {
    const validSignupData = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'New User',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(validSignupData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully!');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(validSignupData.username);
      expect(response.body.user.email).toBe(validSignupData.email);
      expect(response.body.user).not.toHaveProperty('password'); // Ensure password is not returned

      // Check if user is in the database
      const dbUser = await OAuthUser.findOne({ where: { email: validSignupData.email } });
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe(validSignupData.username);
      // Check if password was hashed (cannot check exact hash easily without knowing salt,
      // but can check it's not the plain password)
      expect(dbUser.password).not.toBe(validSignupData.password);
    });

    it('should return 400 for missing username', async () => {
        const { username, ...dataWithoutUsername } = validSignupData;
        const response = await request(app)
          .post('/auth/signup')
          .send(dataWithoutUsername);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body.messages.some(m => m.field === 'username' && m.message === 'Username is required.')).toBe(true);
        expect(response.body.messages.some(m => m.field === 'username' && m.message === 'Username must be at least 3 characters long.')).toBe(true);
      });

      it('should return 400 for missing email', async () => {
        const { email, ...dataWithoutEmail } = validSignupData;
        const response = await request(app)
          .post('/auth/signup')
          .send(dataWithoutEmail);
        expect(response.statusCode).toBe(400);
        // console.log('Missing email response body:', response.body);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body.messages.some(m => m.field === 'email' && m.message === 'Email is required.')).toBe(true);
      });
      
      it('should return 400 for invalid email format', async () => {
        const response = await request(app)
          .post('/auth/signup')
          .send({ ...validSignupData, email: 'invalidemail' });
        expect(response.statusCode).toBe(400);
        // console.log('Invalid email response body:', response.body);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body.messages[0].message).toContain('Please provide a valid email address');
      });
      
      it('should return 400 for password too short', async () => {
        const response = await request(app)
          .post('/auth/signup')
          .send({ ...validSignupData, password: 'short' });
        expect(response.statusCode).toBe(400);
        // console.log('Short password response body:', response.body);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body.messages[0].message).toContain('Password must be at least 8 characters long');
      });

    it('should return 409 if username is already taken', async () => {
        await request(app).post('/auth/signup').send(validSignupData);
        const response = await request(app)
          .post('/auth/signup')
          .send({ ...validSignupData, email: 'another@example.com' });
      
        expect(response.statusCode).toBe(409); // EXPECT 409
        expect(response.body).toHaveProperty('message');
        expect(response.body.message.toLowerCase()).toContain('username already in use');
      });
      
      it('should return 409 if email is already taken', async () => {
        await request(app).post('/auth/signup').send(validSignupData);
        const response = await request(app)
          .post('/auth/signup')
          .send({ ...validSignupData, username: 'anotheruser' });
      
        expect(response.statusCode).toBe(409); // EXPECT 409
        expect(response.body).toHaveProperty('message');
        expect(response.body.message.toLowerCase()).toContain('email already in use');
      });
  });
});