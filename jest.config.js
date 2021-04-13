module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 5.83,
      functions: 8.31,
      lines: 11.21,
      statements: 11.24,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['<rootDir>/ui/app/**/swaps/**/*.test.js'],
};
