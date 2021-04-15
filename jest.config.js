module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 5.83,
      functions: 8.28,
      lines: 11.18,
      statements: 11.21,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['**/ui/**/?(*.)+(test).js'],
};
