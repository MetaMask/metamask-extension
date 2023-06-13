module.exports = {
  // TODO: Remove the `exit` setting, it can hide broken tests.
  exit: true,
  ignore: [
    './app/scripts/lib/**/*.test.js',
    './app/scripts/migrations/*.test.js',
    './app/scripts/platforms/*.test.js',
    './app/scripts/controllers/app-state.test.js',
    './app/scripts/controllers/permissions/**/*.test.js',
    './app/scripts/controllers/mmi-controller.test.js',
    './app/scripts/constants/error-utils.test.js',
    './app/scripts/account-import-strategies/account-import-strategies.test.js',
    './app/scripts/controllers/backup.test.js',
    './app/scripts/controllers/cached-balances.test.js',
    './app/scripts/controllers/incoming-transactions.test.js',
  ],
  recursive: true,
  require: ['test/env.js', 'test/setup.js'],
};
