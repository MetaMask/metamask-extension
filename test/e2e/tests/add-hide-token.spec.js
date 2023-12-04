const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Hide token', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
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
        ganacheOptions,
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

        await driver.clickElement({ text: 'TST', tag: 'p' });

        await driver.clickElement('[data-testid="asset-options__button"]');

        await driver.clickElement('[data-testid="asset-options__hide"]');
        // wait for confirm hide modal to be visible
        const confirmHideModal = await driver.findVisibleElement('span .modal');

        await driver.clickElement(
          '[data-testid="hide-token-confirmation__hide"]',
        );

        // wait for confirm hide modal to be removed from DOM.
        await confirmHideModal.waitForElementState('hidden');

        assets = await driver.findElements('.multichain-token-list-item');
        assert.equal(assets.length, 1);
      },
    );
  });
});

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Add existing token using search', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('renders the balance for the chosen token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({ useTokenDetection: true })
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement({ text: 'Import tokens', tag: 'button' });
        await driver.fill('input[placeholder="Search"]', 'BAT');
        await driver.clickElement({
          text: 'BAT',
          tag: 'span',
        });
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement(
          '[data-testid="import-tokens-modal-import-button"]',
        );

        await driver.waitForSelector({
          css: '.token-overview__primary-balance',
          text: '0 BAT',
        });
      },
    );
  });
});

describe('Add token using wallet_watchAsset', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('opens a notification that adds a token when wallet_watchAsset is executed, then approves', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
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
          'MetaMask Notification',
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
        ganacheOptions,
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
          'MetaMask Notification',
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
