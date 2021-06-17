module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  collectCoverageFrom: ['<rootDir>/ui/**/swaps/**'],
  coveragePathIgnorePatterns: [
    '.stories.js',
    '.snap',
    '**/shared/**/?(*.)+(test).js',
  ],
  coverageThreshold: {
    global: {
      branches: 32.75,
      functions: 42.9,
      lines: 43.12,
      statements: 43.67,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: ['ui/**/?(*.)+(test).js', '**/shared/**/?(*.)+(test).js'],
};
