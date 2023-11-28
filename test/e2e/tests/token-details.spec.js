const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Token Details', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should show token details for an imported token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
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
        await driver.clickElement('[aria-label="Asset options"]');
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
