import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AddRpcProviderDialog from '../../page-objects/pages/dialog/add-rpc-provider';
import TestDapp from '../../page-objects/pages/test-dapp';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/add-network-confirmations';
import UpdateNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/update-network-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Add Custom RPC', function (this: Suite) {
  it('should show warning when adding chainId 0x1(ethereum) and be followed by an wrong chainId error', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        await driver.executeScript(`
        var params = [{
          chainId: "0x1",
          chainName: "Fake Ethereum Network",
          nativeCurrency: {
            name: "",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://customnetwork.test/api/customRPC"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const updateNetworkConfirmation = new UpdateNetworkConfirmation(driver);
        await updateNetworkConfirmation.check_pageIsLoaded('Ethereum Mainnet');

        // Check warning messages are displayed
        await updateNetworkConfirmation.check_warningMessageIsDisplayed(
          'According to our record the network name may not correctly match this chain ID.',
        );
        await updateNetworkConfirmation.check_warningMessageIsDisplayed(
          'According to our records the submitted RPC URL value does not match a known provider for this chain ID.',
        );
        await updateNetworkConfirmation.check_warningMessageIsDisplayed(
          'verify the network details',
        );
        await updateNetworkConfirmation.approveUpdateNetwork();

        const addRpcProviderDialog = new AddRpcProviderDialog(driver);
        await addRpcProviderDialog.check_pageIsLoaded('Ethereum Mainnet');
        await addRpcProviderDialog.approveAddRpcProvider();

        await updateNetworkConfirmation.check_pageIsLoaded('Ethereum Mainnet');
        await updateNetworkConfirmation.check_warningMessageIsDisplayed(
          'Chain ID returned by the custom network does not match the submitted chain ID.',
        );
        assert.equal(
          await updateNetworkConfirmation.check_isApproveButtonEnabled(),
          false,
        );
        await updateNetworkConfirmation.cancelUpdateNetwork();
      },
    );
  });

  it("don't add bad rpc custom network", async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({ useSafeChainsListValidation: true })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        await driver.executeScript(`
        var params = [{
          chainId: "0x123",
          chainName: "Antani",
          nativeCurrency: {
            name: "",
            symbol: "ANTANI",
            decimals: 18
          },
          rpcUrls: ["https://customnetwork.test/api/customRPC"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.check_pageIsLoaded('Antani');
        await addNetworkConfirmation.check_warningMessageIsDisplayed(
          'According to our record the network name may not correctly match this chain ID.',
        );
        await addNetworkConfirmation.check_warningMessageIsDisplayed(
          'The submitted currency symbol does not match what we expect for this chain ID.',
        );
        await addNetworkConfirmation.check_warningMessageIsDisplayed(
          'According to our records the submitted RPC URL value does not match a known provider for this chain ID.',
        );
        await addNetworkConfirmation.check_warningMessageIsDisplayed(
          'verify the network details',
        );

        await addNetworkConfirmation.approveAddNetwork(false);
        await addNetworkConfirmation.check_pageIsLoaded('Antani');
        await addNetworkConfirmation.check_warningMessageIsDisplayed(
          'Chain ID returned by the custom network does not match the submitted chain ID.',
        );
        assert.equal(
          await addNetworkConfirmation.check_isApproveButtonEnabled(),
          false,
        );
        await addNetworkConfirmation.cancelAddNetwork();
      },
    );
  });

  it("don't validate bad rpc custom network when toggle is off", async function () {
    const TEST_CHAIN_ID = '0x123';
    async function mockRPCURLAndChainId(mockServer: MockttpServer) {
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
        await testDapp.check_pageIsLoaded();
        await driver.executeScript(`
        var params = [{
          chainId: "${TEST_CHAIN_ID}",
          chainName: "Antani",
          nativeCurrency: {
            name: "",
            symbol: "ANTANI",
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
        await addNetworkConfirmation.check_pageIsLoaded('Antani');
        await addNetworkConfirmation.approveAddNetwork();
      },
    );
  });

  it("don't add unreachable custom network", async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await driver.executeScript(`
        var params = [{
          chainId: "0x123",
          chainName: "Antani",
          nativeCurrency: {
            name: "",
            symbol: "ANTANI",
            decimals: 18
          },
          rpcUrls: ["https://doesntexist.test/customRPC"],
          blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
        }]
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params
        })
      `);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.check_pageIsLoaded('Antani');
        await addNetworkConfirmation.approveAddNetwork(false);

        await addNetworkConfirmation.check_pageIsLoaded('Antani');
        await addNetworkConfirmation.check_warningMessageIsDisplayed(
          'Error while connecting to the custom network.',
        );
        assert.equal(
          await addNetworkConfirmation.check_isApproveButtonEnabled(),
          false,
        );
        await addNetworkConfirmation.cancelAddNetwork();
      },
    );
  });
});
