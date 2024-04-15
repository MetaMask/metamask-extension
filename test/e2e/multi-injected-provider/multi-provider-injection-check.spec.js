const { strict: assert } = require('assert');
const { withFixtures, openDapp, defaultGanacheOptions } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Multi injected provider interactions', function () {
  it('should check for multiple providers', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await openDapp(driver);

        const eip6963Providers = await driver.findElements('#provider');
        assert.equal(eip6963Providers.length, 2);
      },
    );
  });
});
