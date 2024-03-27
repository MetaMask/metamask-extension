const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Import flow', function () {
  async function mockPriceFetch(mockServer) {
    return [
      await mockServer
        .forGet(
          'https://price-api.metafi.codefi.network/v2/chains/1/spot-prices',
        )
        .withQuery({
          tokenAddresses:
            '0x06af07097c9eeb7fd685c692751d5c66db49c215,0x514910771af9ca656af840dff83e8264ecf986ca,0x7d4b8cce0591c9044a22ee543533b72e976e36c3',
          vsCurrency: 'ETH',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              '0x06af07097c9eeb7fd685c692751d5c66db49c215': {
                eth: 0.0002,
              },
              '0x514910771af9ca656af840dff83e8264ecf986ca': {
                eth: 0.0003,
              },
              '0x7d4b8cce0591c9044a22ee543533b72e976e36c3': {
                eth: 0.0001,
              },
            },
          };
        }),
    ];
  }
  it('allows importing multiple tokens from search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockPriceFetch,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Token list is only on mainnet
        await driver.clickElement('[data-testid="network-display"]');
        const networkSelectionModal = await driver.findVisibleElement(
          '.mm-modal',
        );
        await driver.assertElementNotPresent('.loading-overlay');

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        // Wait for network to change and token list to load from state
        await networkSelectionModal.waitForElementState('hidden');
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

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
        await driver.assertElementNotPresent(
          '[data-testid="token-list-loading-message"]',
        );

        const items = await driver.findElements('.multichain-token-list-item');
        assert.equal(items.length, 4);
      },
    );
  });
});
