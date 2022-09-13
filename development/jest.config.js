module.exports = {
  displayName: '/development',
  collectCoverageFrom: ['<rootDir>/**/*.js'],
  coverageDirectory: '../jest-coverage/development/',
  coverageReporters: ['html', 'text-summary', 'json-summary'],
  coverageThreshold: {
    './development/build/transforms/**/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  resetMocks: true,
  restoreMocks: true,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/build/**/*.test.js'],
  testTimeout: 2500,
};
