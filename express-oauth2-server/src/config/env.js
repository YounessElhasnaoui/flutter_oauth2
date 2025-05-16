// src/config/env.js
const dotenv = require('dotenv');
const path = require('path');

// Load .env file from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  ACCESS_TOKEN_LIFETIME: parseInt(process.env.ACCESS_TOKEN_LIFETIME, 10) || 3600,
  REFRESH_TOKEN_LIFETIME: parseInt(process.env.REFRESH_TOKEN_LIFETIME, 10) || 86400,
  // Add other environment variables you need
};