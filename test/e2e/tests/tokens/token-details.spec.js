const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Token Details', function () {
  it('should show token details for an imported token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement({ text: 'Import tokens', tag: 'button' });
        await driver.clickElement({ text: 'Custom token', tag: 'button' });

        const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
        const tokenSymbol = 'AAVE';

        await driver.fill(
          '[data-testid="import-tokens-modal-custom-address"]',
          tokenAddress,
        );
        await driver.waitForSelector('p.mm-box--color-error-default');
        await driver.fill(
          '[data-testid="import-tokens-modal-custom-symbol"]',
          tokenSymbol,
        );
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement(
          '[data-testid="import-tokens-modal-import-button"]',
        );

        // Go to details page
        await driver.clickElement('[data-testid="home__asset-tab"]');
        const [, tkn] = await driver.findElements(
          '[data-testid="multichain-token-list-button"]',
        );
        await tkn.click();
        await driver.clickElement('[data-testid="asset-options__button"]');

        await driver.clickElement({ text: 'Token details', tag: 'div' });

        const tokenAddressFound = {
          text: tokenAddress,
        };

        const exists = await driver.isElementPresent(tokenAddressFound);

        assert.ok(exists, 'Token details are not correct.');
      },
    );
  });
});
