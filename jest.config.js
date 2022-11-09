module.exports = {
  collectCoverageFrom: [
    '<rootDir>/app/scripts/constants/error-utils.js',
    '<rootDir>/app/scripts/controllers/network/**/*.js',
    '<rootDir>/app/scripts/controllers/permissions/**/*.js',
    '<rootDir>/app/scripts/flask/**/*.js',
    '<rootDir>/app/scripts/lib/**/*.js',
    '<rootDir>/app/scripts/lib/createRPCMethodTrackingMiddleware.js',
    '<rootDir>/app/scripts/migrations/*.js',
    '<rootDir>/app/scripts/platforms/*.js',
    '<rootDir>/shared/**/*.js',
    '<rootDir>/ui/**/*.js',
  ],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageReporters: ['json'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test/test-results/',
        outputName: 'junit.xml',
      },
    ],
  ],
  // TODO: enable resetMocks
  // resetMocks: true,
  restoreMocks: true,
  setupFiles: [
    '<rootDir>/test/setup.js',
    '<rootDir>/test/env.js',
    '<rootDir>/test/jest/env.js', // jest specific env vars that break mocha tests
  ],
  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
  testMatch: [
    '<rootDir>/app/scripts/constants/error-utils.test.js',
    '<rootDir>/app/scripts/controllers/network/**/*.test.js',
    '<rootDir>/app/scripts/controllers/permissions/**/*.test.js',
    '<rootDir>/app/scripts/flask/**/*.test.js',
    '<rootDir>/app/scripts/lib/**/*.test.js',
    '<rootDir>/app/scripts/lib/createRPCMethodTrackingMiddleware.test.js',
    '<rootDir>/app/scripts/migrations/*.test.js',
    '<rootDir>/app/scripts/platforms/*.test.js',
    '<rootDir>/shared/**/*.test.js',
    '<rootDir>/ui/**/*.test.js',
  ],
  testTimeout: 2500,
  // We have to specify the environment we are running in, which is jsdom. The
  // default is 'node'. This can be modified *per file* using a comment at the
  // head of the file. So it may be worthwhile to switch to 'node' in any
  // background tests.
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  workerIdleMemoryLimit: '500MB',
};
