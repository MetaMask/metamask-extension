module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['**/ui/app/pages/swaps/**/?(*.)+(test).js'],
};
