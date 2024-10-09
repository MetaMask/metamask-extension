module.exports = {
  collectCoverageFrom: [
    '<rootDir>/app/scripts/**/*.(js|ts|tsx)',
    '<rootDir>/shared/**/*.(js|ts|tsx)',
    '<rootDir>/ui/**/*.(js|ts|tsx)',
    '<rootDir>/development/build/transforms/**/*.js',
    '<rootDir>/test/unit-global/**/*.test.(js|ts|tsx)',
  ],
  coverageDirectory: './coverage/unit',
  coveragePathIgnorePatterns: ['.stories.*', '.snap'],
  coverageReporters: ['html', 'json'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test/test-results/',
        outputName: 'junit.xml',
      },
    ],
  ],
  // TODO: enable resetMocks
  // resetMocks: true,
  restoreMocks: true,
  setupFiles: [
    'jest-canvas-mock',
    '<rootDir>/test/setup.js',
    '<rootDir>/test/env.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
  testMatch: [
    '<rootDir>/app/scripts/**/*.test.(js|ts|tsx)',
    '<rootDir>/shared/**/*.test.(js|ts|tsx)',
    '<rootDir>/ui/**/*.test.(js|ts|tsx)',
    '<rootDir>/development/**/*.test.(js|ts|tsx)',
    '<rootDir>/test/unit-global/**/*.test.(js|ts|tsx)',
    '<rootDir>/test/e2e/helpers.test.js',
  ],
  testPathIgnorePatterns: ['<rootDir>/development/webpack/'],
  testTimeout: 5500,
  // We have to specify the environment we are running in, which is jsdom. The
  // default is 'node'. This can be modified *per file* using a comment at the
  // head of the file. So it may be worthwhile to switch to 'node' in any
  // background tests.
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  workerIdleMemoryLimit: '500MB',
};
