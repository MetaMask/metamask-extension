const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { CHAIN_IDS } = require('../../../../shared/constants/network');

describe('Add hide token', function () {
  it('hides the token when clicked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTokensController({
            allTokens: {
              [toHex(1337)]: {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.waitForSelector({
          css: '[data-testid="multichain-token-list-item-value"]',
          text: '0 TST',
        });

        let assets = await driver.findElements('.multichain-token-list-item');
        assert.equal(assets.length, 2);

        await driver.clickElement({ text: 'Tokens', tag: 'button' });

        await driver.clickElement({ text: 'TST', tag: 'span' });

        await driver.clickElement('[data-testid="asset-options__button"]');

        await driver.clickElement('[data-testid="asset-options__hide"]');
        // wait for confirm hide modal to be visible
        const confirmHideModal =
          '[data-testid="hide-token-confirmation-modal"]';
        await driver.findVisibleElement(confirmHideModal);

        await driver.clickElement(
          '[data-testid="hide-token-confirmation__hide"]',
        );

        // wait for confirm hide modal to be removed from DOM.
        await driver.assertElementNotPresent(confirmHideModal);

        assets = await driver.findElements('.multichain-token-list-item');
        assert.equal(assets.length, 1);
      },
    );
  });
});

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Add existing token using search', function () {
  // Mock call to core to fetch BAT token price
  async function mockPriceFetch(mockServer) {
    return [
      await mockServer
        .forGet(
          'https://price-api.metafi.codefi.network/v2/chains/56/spot-prices',
        )
        .withQuery({
          tokenAddresses: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
          vsCurrency: 'ETH',
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              '0x0d8775f648430679a709e98d2b0cb6250d2887ef': {
                eth: 0.0001,
              },
            },
          };
        }),
    ];
  }
  it('renders the balance for the chosen token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.BSC })
          .withPreferencesController({ useTokenDetection: true })
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          chainId: parseInt(CHAIN_IDS.BSC, 16),
        },
        title: this.test.fullTitle(),
        testSpecificMock: mockPriceFetch,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement({ text: 'Import tokens', tag: 'button' });
        await driver.fill('input[placeholder="Search tokens"]', 'BAT');
        await driver.clickElement({
          text: 'BAT',
          tag: 'p',
        });
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement(
          '[data-testid="import-tokens-modal-import-button"]',
        );
        await driver.clickElement('[data-testid="home__asset-tab"]');
        const [, tkn] = await driver.findElements(
          '[data-testid="multichain-token-list-button"]',
        );
        await tkn.click();

        // TODO: Simplify once MMI has the new asset page
        try {
          await driver.waitForSelector({
            css: '[data-testid="multichain-token-list-item-value"]',
            text: '0 BAT',
          });
        } catch {
          await driver.waitForSelector({
            css: '.token-overview__primary-balance',
            text: '0 BAT',
          });
        }
      },
    );
  });
});

describe('Add token using wallet_watchAsset', function () {
  it('opens a notification that adds a token when wallet_watchAsset is executed, then approves', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.openNewPage('http://127.0.0.1:8080/');

        await driver.executeScript(`
          window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                symbol: 'TST',
                decimals: 4
              },
            }
          })
        `);

        const windowHandles = await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Add token',
        });

        await driver.switchToWindowWithTitle('MetaMask', windowHandles);

        await driver.waitForSelector({
          css: '[data-testid="multichain-token-list-item-value"]',
          text: '0 TST',
        });
      },
    );
  });

  it('opens a notification that adds a token when wallet_watchAsset is executed, then rejects', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.openNewPage('http://127.0.0.1:8080/');

        await driver.executeScript(`
          window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                symbol: 'TST',
                decimals: 4
              },
            }
          })
        `);

        const windowHandles = await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Cancel',
        });

        await driver.switchToWindowWithTitle('MetaMask', windowHandles);

        const assetListItems = await driver.findElements(
          '.multichain-token-list-item',
        );

        assert.strictEqual(assetListItems.length, 1);
      },
    );
  });
});
