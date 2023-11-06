module.exports = {
  // TODO: Remove the `exit` setting, it can hide broken tests.
  exit: true,
  ignore: [
    './app/scripts/lib/**/*.test.js',
    './app/scripts/migrations/*.test.js',
    './app/scripts/platforms/*.test.js',
<<<<<<< HEAD
    './app/scripts/controllers/network/**/*.test.js',
=======
    './app/scripts/controllers/detect-tokens.test.js',
    './app/scripts/controllers/app-state.test.js',
>>>>>>> upstream/multichain-swaps-controller
    './app/scripts/controllers/permissions/**/*.test.js',
    './app/scripts/constants/error-utils.test.js',
  ],
  recursive: true,
  require: ['test/env.js', 'test/setup.js'],
};
