module.exports = {
  collectCoverageFrom: [
    '<rootDir>/shared/**/*.(js|ts|tsx)',
    '<rootDir>/ui/**/*.(js|ts|tsx)',
  ],
  coverageDirectory: './coverage/integration',
  coveragePathIgnorePatterns: ['.stories.*', '.snap', '.test.(js|ts|tsx)'],
  coverageReporters: ['html', 'json'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test/test-results/integration',
        outputName: 'junit.xml',
      },
    ],
  ],
  restoreMocks: true,
  setupFiles: [
    'jest-canvas-mock',
    '<rootDir>/test/integration/config/setup.js',
    '<rootDir>/test/integration/config/env.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/integration/config/setupAfter.js'],
  testMatch: ['<rootDir>/test/integration/**/*.test.(js|ts|tsx)'],
  testPathIgnorePatterns: ['<rootDir>/test/integration/config/*'],
  testTimeout: 15000,
  // We have to specify the environment we are running in, which is jsdom. The
  // default is 'node'. This can be modified *per file* using a comment at the
  // head of the file. So it may be worthwhile to switch to 'node' in any
  // background tests.
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  workerIdleMemoryLimit: '500MB',
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(css|scss|sass|less)$': 'jest-preview/transforms/css',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)':
      'jest-preview/transforms/file',
  },
  transformIgnorePatterns: ['/node_modules/'],
};
