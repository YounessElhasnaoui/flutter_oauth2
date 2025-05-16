const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectOptions: {
      // ssl: { require: true, rejectUnauthorized: false } // if you need SSL
    },
  },
  test: {
    username: process.env.DB_USER || 'postgres_test_user', // Use different creds/DB for tests
    password: process.env.DB_PASS || 'testpassword',
    database: process.env.DB_NAME || 'oauth2_server_test',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL', // For Heroku, Render, etc.
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Adjust based on your provider's SSL cert
      },
    },
  },
};