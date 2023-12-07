const { strict: assert } = require('assert');
const {
  withFixtures,
  convertToHexValue,
  regularDelayMs,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Import flow', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('allows importing multiple tokens from search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Token list is only on mainnet
        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        // Wait for network to change and token list to load from state
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="import-token-button"]');
        await driver.fill('input[placeholder="Search"]', 'cha');

        await driver.clickElement('.token-list__token');
        await driver.clickElement('.token-list__token:nth-of-type(2)');
        await driver.clickElement('.token-list__token:nth-of-type(3)');

        await driver.clickElement({
          css: '.import-tokens-modal button',
          text: 'Next',
        });
        await driver.clickElement({
          css: '.import-tokens-modal button',
          text: 'Import',
        });

        await driver.clickElement('.asset-breadcrumb');

        // Wait for "loading tokens" to be gone
        await driver.waitForElementNotPresent(
          '[data-testid="token-list-loading-message"]',
        );

        const items = await driver.findElements('.multichain-token-list-item');
        assert.equal(items.length, 4);
      },
    );
  });
});
