module.exports = {
  collectCoverage: true,
  coverageDirectory: 'jest-coverage',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: [
    '<rootDir>/development/build/transforms/**/*.js',
    // '<rootDir>/shared/**/*.js',
    // '<rootDir>/ui/**/*.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // "development"
    './development/build/utils.js',
    // "ui"
    '.stories.js',
    '.snap',
  ],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 37,
      lines: 43,
      statements: 43,
    },
  },
  projects: [
    {
      displayName: 'development',
      resetMocks: true,
      restoreMocks: true,
      testEnvironment: 'node',
      testMatch: ['<rootDir>/development/build/transforms/?(*.)+(test).js'],
    },
    // {
    //   displayName: 'ui',
    //   // TODO: enable resetMocks
    //   // resetMocks: true,
    //   restoreMocks: true,
    //   setupFiles: ['./test/setup.js', './test/env.js'],
    //   setupFilesAfterEnv: ['./test/jest/setup.js'],
    //   testMatch: [
    //     '<rootDir>/ui/**/?(*.)+(test).js',
    //     '<rootDir>/shared/**/?(*.)+(test).js',
    //   ],
    // },
  ],
};
