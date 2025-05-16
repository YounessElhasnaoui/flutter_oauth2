const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const envConfig = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const oauthMainRoutes = require('./oauth/oauth.routes');
const authRoutes = require('./routes/auth.routes'); // New auth routes
// const oauthRoutes = require('./oauth/oauth.routes'); // We'll add this later
// const apiRoutes = require('./routes/api.routes'); // For other API routes

const app = express();

// Middlewares
app.use(helmet()); // Secure HTTP headers
app.use(cors());   // Enable CORS - configure origins in production
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use('/oauth', oauthMainRoutes);
app.use('/auth', authRoutes);


// HTTP request logger
if (envConfig.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // More comprehensive logging for production
}

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the OAuth2 Server API!',
    environment: envConfig.NODE_ENV,
  });
});


// TODO: Mount other API routes
// app.use('/api/v1', apiRoutes);


// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

module.exports = app;