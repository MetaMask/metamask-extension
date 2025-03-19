const { mockNetworkStateOld } = require('../../../stub/networks');

const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

describe('Block Explorer', function () {
  it('links to the users account on the explorer, ', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController(
            mockNetworkStateOld({
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              blockExplorerUrl: 'https://etherscan.io/',
            }),
          )
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // View account on explorer
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement({ text: 'View on explorer', tag: 'p' });

        // Switch to block explorer
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify block explorer
        await driver.waitForUrl({
          url: 'https://etherscan.io/address/0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
        });

        await driver.waitForSelector({
          text: 'Empty page by MetaMask',
          tag: 'body',
        });
      },
    );
  });

  it('links to the token tracker in the explorer, ', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController({
            ...mockNetworkStateOld({
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              blockExplorerUrl: 'https://etherscan.io/',
            }),
          })
          .withTokensControllerERC20()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract: SMART_CONTRACTS.HST,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // View TST token in block explorer
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );

        await driver.clickElement({
          text: 'TST',
          tag: 'span',
        });

        await driver.clickElement('[data-testid="asset-options__button"]');
        await driver.clickElement({
          text: 'View Asset in explorer',
          tag: 'div',
        });

        // Switch to block explorer
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify block explorer
        await driver.waitForUrl({
          url: 'https://etherscan.io/token/0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        });

        await driver.waitForSelector({
          text: 'Empty page by MetaMask',
          tag: 'body',
        });
      },
    );
  });

  it('links to the transaction on the explorer, ', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            ...mockNetworkStateOld({
              id: 'localhost-client-id',
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              blockExplorerUrl: 'https://etherscan.io',
            }),
          })
          .withTransactionControllerCompletedTransaction()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // View transaction on block explorer
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.clickElement('[data-testid="activity-list-item-action"]');
        await driver.clickElement({
          text: 'View on block explorer',
          tag: 'a',
        });

        // Switch to block explorer
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify block explorer
        await driver.waitForUrl({
          url: 'https://etherscan.io/tx/0xe5e7b95690f584b8f66b33e31acc6184fea553fa6722d42486a59990d13d5fa2',
        });

        await driver.waitForSelector({
          text: 'Empty page by MetaMask',
          tag: 'body',
        });
      },
    );
  });
});
