module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  collectCoverageFrom: ['<rootDir>/ui/**/*.js', '<rootDir>/shared/**/*.js'],
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 37,
      lines: 43,
      statements: 43,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: [
    '<rootDir>/ui/**/?(*.)+(test).js',
    '<rootDir>/shared/**/?(*.)+(test).js',
  ],
};
