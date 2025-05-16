const http = require('http');
const app = require('./app');
const envConfig = require('./config/env');
const { testDbConnection, sequelize } = require('./models'); // Import from models/index.js

const PORT = envConfig.PORT;
const server = http.createServer(app);

async function startServer() {
  try {
    // 1. Test Database Connection
    await testDbConnection();

    // Optional: Sync database if needed (ONLY for development, prefer migrations)
    if (envConfig.NODE_ENV === 'development') {
       await sequelize.sync({ alter: true }); // or { force: true } to drop and recreate
       console.log('Database synced (development only)');
     }

    // 2. Start HTTP Server
    server.listen(PORT, () => {
      console.log(`Server running in ${envConfig.NODE_ENV} mode on port ${PORT}`);
      console.log(`Access it at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await sequelize.close();
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
      process.exit(0);
    });

    // Force shutdown if server hasn't closed in time
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000); // 10 seconds
  });
});

startServer();