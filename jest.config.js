module.exports = {
  collectCoverageFrom: [
    '<rootDir>/app/scripts/controllers/permissions/**/*.js',
    '<rootDir>/app/scripts/lib/createRPCMethodTrackingMiddleware.js',
    '<rootDir>/shared/**/*.js',
    '<rootDir>/ui/**/*.js',
  ],
  coverageDirectory: './jest-coverage/main',
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageReporters: ['html', 'text-summary', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 44,
      functions: 42,
      lines: 52,
      statements: 52,
    },
    './app/scripts/controllers/permissions/**/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './app/scripts/lib/createRPCMethodTrackingMiddleware.js': {
      branches: 95.65,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  // TODO: enable resetMocks
  // resetMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/test/setup.js', '<rootDir>/test/env.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
  testMatch: [
    '<rootDir>/ui/**/*.test.js',
    '<rootDir>/shared/**/*.test.js',
    '<rootDir>/app/scripts/lib/**/*.test.js',
    '<rootDir>/app/scripts/migrations/*.test.js',
    '<rootDir>/app/scripts/platforms/*.test.js',
    '<rootDir>app/scripts/controllers/network/**/*.test.js',
    '<rootDir>/app/scripts/controllers/permissions/**/*.test.js',
    '<rootDir>/app/scripts/lib/createRPCMethodTrackingMiddleware.test.js',
  ],
  testTimeout: 2500,
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.mdx$': '@storybook/addon-docs/jest-transform-mdx',
  },
};
