// nyc is our coverage reporter for mocha, and currently is collecting
// coverage for .yarn folder. all of these are default excludes except the
// .yarn/** entry. This entire file should be removable once we complete the
// migration from mocha to jest in the app folder.
module.exports = {
  exclude: [
    'coverage/**',
    'packages/*/test/**',
    'test/**',
    'test{,-*}.js',
    '**/*{.,-}test.js',
    '**/__tests__/**',
    '**/node_modules/**',
    '**/babel.config.js',
    '.yarn/**',
  ],
};
