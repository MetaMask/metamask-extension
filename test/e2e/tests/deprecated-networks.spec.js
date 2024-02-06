const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { withFixtures, unlockWallet } = require('../helpers');

describe('Deprecated networks', function () {
  it('When selecting the Goerli test network, the users should see a warning message', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Goerli' });

        const deprecationWarningText =
          'Because of updates to the Ethereum system, the Goerli test network will be phased out soon.';
        const isDeprecationWarningDisplayed = await driver.isElementPresent({
          text: deprecationWarningText,
        });

        assert.equal(
          isDeprecationWarningDisplayed,
          true,
          'Goerli deprecation warning is not displayed',
        );
      },
    );
  });
});
