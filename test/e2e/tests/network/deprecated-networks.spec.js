const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  unlockWallet,
  openDapp,
  WINDOW_TITLES,
} = require('../../helpers');
const { CHAIN_IDS } = require('../../../../shared/constants/network');

describe('Deprecated networks', function () {
  it('User should not find goerli network when clicking on the network selector', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="network-display"]');

        const isGoerliNetworkPresent = await driver.isElementPresent(
          '[data-testid="Goerli"]',
        );

        assert.equal(isGoerliNetworkPresent, false);
      },
    );
  });

  it('Should show deprecation warning when switching to Arbitrum goerli testnet', async function () {
    const TEST_CHAIN_ID = CHAIN_IDS.ARBITRUM_GOERLI;
    async function mockRPCURLAndChainId(mockServer) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.url/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: TEST_CHAIN_ID,
            },
          })),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({ useSafeChainsListValidation: false })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.executeScript(`
        var params = [{
          chainId: "${TEST_CHAIN_ID}",
          chainName: "Arbitrum Goerli",
          nativeCurrency: {
            name: "",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://responsive-rpc.url/"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const [extension] = windowHandles;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        const switchNetworkBtn = await driver.findElement({
          tag: 'button',
          text: 'Switch network',
        });

        await switchNetworkBtn.click();

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
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

  it('Should show deprecation warning when switching to Optimism goerli testnet', async function () {
    const TEST_CHAIN_ID = CHAIN_IDS.OPTIMISM_GOERLI;
    async function mockRPCURLAndChainId(mockServer) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.url/')
          .thenCallback(() => ({
            statusCode: 200,
            json: {
              id: '1694444405781',
              jsonrpc: '2.0',
              result: TEST_CHAIN_ID,
            },
          })),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({ useSafeChainsListValidation: false })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.executeScript(`
        var params = [{
          chainId: "${TEST_CHAIN_ID}",
          chainName: "Optimism Goerli",
          nativeCurrency: {
            name: "",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://responsive-rpc.url/"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const [extension] = windowHandles;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        const switchNetworkBtn = await driver.findElement({
          tag: 'button',
          text: 'Switch network',
        });

        await switchNetworkBtn.click();

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
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
