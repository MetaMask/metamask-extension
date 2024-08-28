const {
  createServiceBuilder,
  stopServiceBuilder,
} = require('./webdriver-lifecycle');

module.exports.mochaHooks = {
  async beforeAll() {
    await createServiceBuilder();
  },

  async afterAll() {
    await stopServiceBuilder();
  },
};
