module.exports = {
  // TODO: Remove the `exit` setting, it can hide broken tests.
  exit: true,
  ignore: ['./app/scripts/migrations/*.test.js'],
  recursive: true,
  require: ['test/env.js', 'test/setup.js'],
}
