/* eslint-disable import/unambiguous */
module.exports = {
  collectCoverageFrom: ['<rootDir>/ui/**/*.js'],
  coverageDirectory: './jest-coverage/main',
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 37,
      lines: 43,
      statements: 43,
    },
  },
  // TODO: enable resetMocks
  // resetMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/test/setup.js', '<rootDir>/test/env.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
  testMatch: ['<rootDir>/ui/**/*stories.test.js'],
  testTimeout: 2500,
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.mdx$': '@storybook/addon-docs/jest-transform-mdx',
  },
};
