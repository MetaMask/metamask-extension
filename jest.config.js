module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  collectCoverageFrom: ['<rootDir>/ui/**/swaps/**'],
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageThreshold: {
    global: {
      branches: 32.75,
      functions: 40,
      lines: 42.29,
      statements: 42.83,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: [
    '<rootDir>/ui/**/?(*.)+(test).js',
    '<rootDir>/shared/**/?(*.)+(test).js',
  ],
};
