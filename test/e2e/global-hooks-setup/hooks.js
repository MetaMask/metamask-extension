const { createServiceBuilder } = require('./webdriver-lifecycle');

module.exports.mochaHooks = {
  async beforeAll() {
    await createServiceBuilder();
  },
};
