module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  coverageThreshold: {
    global: {
      branches: 6.4,
      functions: 9.77,
      lines: 8.87,
      statements: 0.09,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  testMatch: ['<rootDir>/ui/app/**/swaps/**/*.test.js'],
};
