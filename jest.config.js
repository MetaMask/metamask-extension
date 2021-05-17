module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  collectCoverageFrom: ['<rootDir>/ui/**/swaps/**'],
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageThreshold: {
    global: {
      branches: 32.75,
      functions: 43.31,
      lines: 43.12,
      statements: 43.67,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: ['**/ui/**/?(*.)+(test).js'],
};
