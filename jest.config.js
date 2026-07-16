const consoleReporterRules = require('./test/jest/console-reporter-rules-unit');

module.exports = {
  collectCoverageFrom: [
    '<rootDir>/app/scripts/**/*.(js|ts|tsx)',
    '<rootDir>/app/offscreen/**/*.(js|ts|tsx)',
    '<rootDir>/shared/**/*.(js|ts|tsx)',
    '<rootDir>/ui/**/*.(js|ts|tsx)',
    '<rootDir>/development/build/transforms/**/*.js',
    '<rootDir>/development/metamaskbot-build-announce/**/*.(js|ts|mts)',
    '<rootDir>/test/unit-global/**/*.test.(js|ts|tsx)',
  ],
  coverageDirectory: './coverage/unit',
  coveragePathIgnorePatterns: ['.stories.*', '.snap$'],
  coverageReporters: ['html', 'json'],
  moduleNameMapper: {
    // Mock lightweight-charts since it requires browser/canvas APIs not available in Jest
    '^lightweight-charts$': '<rootDir>/test/mocks/lightweight-charts.js',
    // Stub @metamask/perps-controller so every test suite can resolve it without
    // listing jest.mock() individually. Tests needing a fuller fake can still
    // override with their own jest.mock() call.
    '^@metamask/perps-controller$':
      '<rootDir>/test/mocks/metamask-perps-controller.js',
    '^~/ui/(.*)$': '<rootDir>/ui/$1',
    '^~/shared/(.*)$': '<rootDir>/shared/$1',
  },
  // This mirrors Jest's default module extensions with `mts` added. Importing
  // `jest-config` defaults would avoid this list, but lint rejects that package
  // because it is not a declared dependency of this project.
  moduleFileExtensions: [
    'js',
    'mjs',
    'cjs',
    'jsx',
    'ts',
    'tsx',
    'mts',
    'json',
    'node',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.metamask/cache/java-tron-up/'],
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
    'summary',
    [
      'jest-junit',
      {
        outputDirectory: 'test/test-results/',
        outputName: 'junit.xml',
        addFileAttribute: 'true',
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
    '<rootDir>/app/offscreen/**/*.test.(js|ts|tsx)',
    '<rootDir>/.github/scripts/**/*.test.(js|ts|mts)',
    '<rootDir>/shared/**/*.test.(js|ts|tsx)',
    '<rootDir>/ui/**/*.test.(js|ts|tsx)',
    '<rootDir>/development/**/*.test.(js|ts|tsx|mts)',
    '<rootDir>/test/unit-global/**/*.test.(js|ts|tsx)',
    '<rootDir>/test/e2e/helpers.test.js',
    '<rootDir>/test/e2e/helpers/**/*.test.(js|ts|tsx)',
    '<rootDir>/test/e2e/benchmarks/**/*.test.(js|ts|tsx)',
    '<rootDir>/test/e2e/feature-flags/**/*.test.(js|ts|tsx)',
    '<rootDir>/test/e2e/playwright/llm-workflow/**/*.test.(js|ts|tsx)',
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
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.mts$': [
      'babel-jest',
      {
        plugins: [require.resolve('./test/jest/transform-import-meta-url.js')],
      },
    ],
  },
  workerIdleMemoryLimit: '500MB',
  // Ensure console output is buffered (not streamed) so reporters can access testResult.console
  // Without this, Jest uses verbose mode for single-file runs which bypasses buffering
  verbose: false,
};
