module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 21.24,
      functions: 23.01,
      lines: 27.19,
      statements: 27.07,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: ['**/ui/**/?(*.)+(test).js'],
};
