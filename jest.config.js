module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 7.05,
      functions: 8.85,
      lines: 11.79,
      statements: 11.81,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['**/ui/**/?(*.)+(test).js'],
};
