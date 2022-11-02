module.exports = {
  displayName: '/development',
  collectCoverageFrom: ['<rootDir>/build/transforms/**/*.js'],
  coverageDirectory: '../jest-coverage/development/',
  coverageReporters: ['html', 'text-summary', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  resetMocks: true,
  restoreMocks: true,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/build/transforms/**/*.test.js'],
  testTimeout: 2500,
};
