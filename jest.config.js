module.exports = {
  collectCoverageFrom: ['<rootDir>/ui/**/*.js', '<rootDir>/shared/**/*.js'],
  coverageDirectory: './jest-coverage/main',
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 37,
      lines: 43,
      statements: 43,
    },
  },
  // TODO: enable resetMocks
  // resetMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/test/setup.js', '<rootDir>/test/env.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
  testMatch: [
    '<rootDir>/ui/**/*.test.js',
    '<rootDir>/shared/**/*.test.js',
    '<rootDir>/app/scripts/migrations/*.test.js',
  ],
  testTimeout: 2500,
};
