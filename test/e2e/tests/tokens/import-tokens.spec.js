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
        .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
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
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController({
            tokenList: [
              {
                name: 'Chain Games',
                symbol: 'CHAIN',
                address: '0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
              },
              {
                address: '0x7051faed0775f664a0286af4f75ef5ed74e02754',
                symbol: 'CHANGE',
                name: 'ChangeX',
              },
              {
                name: 'Chai',
                symbol: 'CHAI',
                address: '0x06af07097c9eeb7fd685c692751d5c66db49c215',
              },
            ],
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockPriceFetch,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.assertElementNotPresent('.loading-overlay');

        await driver.clickElement('[data-testid="import-token-button"]');
        await driver.clickElement('[data-testid="importTokens"]');

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

        await driver.assertElementNotPresent(
          '[data-testid="token-list-loading-message"]',
        );

        await driver.clickElement('[data-testid="sort-by-networks"]');
        await driver.clickElement('[data-testid="network-filter-current"]');

        const expectedTokenListElementsAreFound =
          await driver.elementCountBecomesN('.multichain-token-list-item', 4);
        assert.equal(expectedTokenListElementsAreFound, true);
      },
    );
  });
});
