import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import {
  openDapp,
  openPopupWithActiveTabOrigin,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Mockttp } from '../../mock-e2e';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/add-network-confirmations';
import Homepage from '../../page-objects/pages/home/homepage';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { DAPP_URL } from '../../constants';

describe('Deprecated networks', function (this: Suite) {
  it('User should not find goerli network when clicking on the network selector', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // Navigate to extension home screen
        await unlockWallet(driver);
        // Open the first dapp which starts on chain '0x539
        await openDapp(driver, undefined, DAPP_URL);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);
        await driver.clickElement('.multichain-connected-site-menu ');
        await driver.clickElement({
          text: 'Localhost 8545',
          tag: 'button',
        });

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkNetworkOptionIsDisplayed(
          'Goerli',
          false,
        );
      },
    );
  });

  it('Should show deprecation warning when switching to Arbitrum goerli testnet', async function () {
    const TEST_CHAIN_ID = CHAIN_IDS.ARBITRUM_GOERLI;
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
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
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await driver.executeScript(`
        var params = [{
          chainId: "${TEST_CHAIN_ID}",
          chainName: "Arbitrum Goerli",
          nativeCurrency: {
            name: "",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://responsive-rpc.test/"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.checkPageIsLoaded('Arbitrum Goerli');
        await addNetworkConfirmation.approveAddNetwork();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new Homepage(driver).checkWarningMessageIsDisplayed(
          'Because of updates to the Ethereum system, the Goerli test network will be phased out soon.',
        );
      },
    );
  });

  it('Should show deprecation warning when switching to Optimism goerli testnet', async function () {
    const TEST_CHAIN_ID = CHAIN_IDS.OPTIMISM_GOERLI;
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await driver.executeScript(`
        var params = [{
          chainId: "${TEST_CHAIN_ID}",
          chainName: "Optimism Goerli",
          nativeCurrency: {
            name: "",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://responsive-rpc.test/"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.checkPageIsLoaded('Optimism Goerli');
        await addNetworkConfirmation.approveAddNetwork();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new Homepage(driver).checkWarningMessageIsDisplayed(
          'Because of updates to the Ethereum system, the Goerli test network will be phased out soon.',
        );
      },
    );
  });

  it('Should show deprecation warning when switching to Polygon mumbai', async function () {
    const TEST_CHAIN_ID = CHAIN_IDS.POLYGON_TESTNET;
    async function mockRPCURLAndChainId(mockServer: Mockttp) {
      return [
        await mockServer
          .forPost('https://responsive-rpc.test/')
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
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRPCURLAndChainId,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await driver.executeScript(`
        var params = [{
          chainId: "${TEST_CHAIN_ID}",
          chainName: "Polygon Mumbai",
          nativeCurrency: {
            name: "",
            symbol: "MATIC",
            decimals: 18
          },
          rpcUrls: ["https://responsive-rpc.test/"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.checkPageIsLoaded('Polygon Mumbai');
        await addNetworkConfirmation.approveAddNetwork();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new Homepage(driver).checkWarningMessageIsDisplayed(
          'This network is deprecated',
        );
      },
    );
  });
});
