/**
 * Using require() here instead of import because this is a CommonJS file
 * (using module.exports). We can't mix CommonJS and ES6 module syntax in the
 * same file. To use ES6 imports, we would need to convert this file to .mjs
 * and use 'export default' instead of 'module.exports'.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const consoleReporterRules = require('./test/jest/console-reporter-rules-unit');

module.exports = {
  collectCoverageFrom: [
    '<rootDir>/app/scripts/**/*.(js|ts|tsx)',
    '<rootDir>/shared/**/*.(js|ts|tsx)',
    '<rootDir>/ui/**/*.(js|ts|tsx)',
    '<rootDir>/development/build/transforms/**/*.js',
    '<rootDir>/test/unit-global/**/*.test.(js|ts|tsx)',
  ],
  coverageDirectory: './coverage/unit',
  coveragePathIgnorePatterns: ['.stories.*', '.snap$'],
  coverageReporters: ['html', 'json'],
  // The path to the Prettier executable used to format snapshots
  // Jest doesn't support Prettier 3 yet, so we use Prettier 2
  prettierPath: require.resolve('prettier-2'),
  reporters: [
    // Console baseline reporter MUST be first to capture raw console messages
    // before jest-clean-console-reporter processes them
    [
      '<rootDir>/test/jest/console-baseline-reporter.js',
      {
        testType: 'unit',
      },
    ],
    [
      'jest-clean-console-reporter',
      {
        rules: consoleReporterRules,
      },
    ],
    '<rootDir>/test/jest/summary-reporter.js',
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
    '<rootDir>/test/e2e/helpers/**/*.test.(js|ts|tsx)',
  ],
  testPathIgnorePatterns: ['<rootDir>/development/webpack/'],
  testTimeout: 5500,
  // We have to specify the environment we are running in, which is jsdom. The
  // default is 'node'. This can be modified *per file* using a comment at the
  // head of the file. So it may be worthwhile to switch to 'node' in any
  // background tests. `jest-fixed-jsdom` is an improved version of jsdom.
  testEnvironment: 'jest-fixed-jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  workerIdleMemoryLimit: '500MB',
  // Ensure console output is buffered (not streamed) so reporters can access testResult.console
  // Without this, Jest uses verbose mode for single-file runs which bypasses buffering
  verbose: false,
};
