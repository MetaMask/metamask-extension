module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 6.94,
      functions: 8.85,
      lines: 11.76,
      statements: 11.78,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['**/ui/**/?(*.)+(test).js'],
};
