/* eslint-disable import/unambiguous */
module.exports = {
  coverageDirectory: './jest-coverage/storybook',
  coverageReporters: ['html', 'text-summary'],
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
