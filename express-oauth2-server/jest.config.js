module.exports = {
    testEnvironment: 'node', // Use Node.js environment for backend tests
    verbose: true,           // Display individual test results with the test suite hierarchy
    bail: 1,                 // Stop running tests after 1 failure (optional, good for CI)
    testTimeout: 30000,      // Increase timeout if tests involve DB operations (default is 5000ms)
    // setupFilesAfterEnv: ['./jest.setup.js'], // Optional: for global setup after environment is set up
    // coveragePathIgnorePatterns: [ // Optional: exclude files from coverage reports
    //   '/node_modules/',
    //   '/src/config/',
    //   '/src/migrations/',
    //   '/src/seeders/',
    //   '/src/server.js', // Usually app.js is tested, not the server bootstrap
    // ],
  };