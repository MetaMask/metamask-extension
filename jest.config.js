module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 6.3,
      functions: 9.43,
      lines: 8.66,
      statements: 8.88,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['**/ui/app/pages/swaps/**/?(*.)+(test).js'],
};
