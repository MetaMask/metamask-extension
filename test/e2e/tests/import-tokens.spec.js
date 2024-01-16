const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Import flow', function () {
  it('allows importing multiple tokens from search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Token list is only on mainnet
        await driver.clickElement('[data-testid="network-display"]');
        const networkSelectionModal = await driver.findVisibleElement(
          '.mm-modal',
        );

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        // Wait for network to change and token list to load from state
        await networkSelectionModal.waitForElementState('hidden');
        if (process.env.MULTICHAIN) {
          await driver.findVisibleElement(
            '[data-testid="multichain-token-list-item-secondary-value"]',
          );
        } else {
          await driver.findVisibleElement(
            '[data-testid="eth-overview__secondary-currency"]',
          );
        }

        await driver.clickElement('[data-testid="import-token-button"]');

        await driver.fill('input[placeholder="Search tokens"]', 'cha');

        await driver.clickElement('.token-list__token_component');
        await driver.clickElement(
          '.token-list__token_component:nth-of-type(2)',
        );
        await driver.clickElement(
          '.token-list__token_component:nth-of-type(3)',
        );

        await driver.clickElement('[data-testid="import-tokens-button-next"]');
        await driver.clickElement(
          '[data-testid="import-tokens-modal-import-button"]',
        );

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
