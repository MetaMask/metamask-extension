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
  // We have to specify the environment we are running in, which is jsdom. The
  // default is 'node'. This can be modified *per file* using a comment at the
  // head of the file. So it may be worth while to switch to 'node' in any
  // background tests.
  testEnvironment: 'jsdom',
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '^.+\\.mdx$': '@storybook/addon-docs/jest-transform-mdx',
  },
  // Our configuration somehow is calling into the esm folder / files of
  // some modules. Jest supports ESM but our code is not set to emit ESM files
  // so we are telling jest to use babel to transform the node_modules listed.
  // Note: for some reason I could not hammer down to the node_modules
  // installed in @metamask/controllers so I had to just blanket specify all
  // of the @metamask/controllers folder.
  transformIgnorePatterns: [
    '/node_modules/(?!(multiformats|uuid|nanoid|@metamask/controllers|@metamask/snap-controllers)/)',
  ],
  workerIdleMemoryLimit: '500MB',
};
