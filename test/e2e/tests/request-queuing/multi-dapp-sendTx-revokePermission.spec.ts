import { Suite } from 'mocha';
import { withFixtures, unlockWallet, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { DAPP_URL, DAPP_ONE_URL } from '../../constants';
import TestDapp from '../../page-objects/pages/test-dapp';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';

describe('Request Queuing for Multiple Dapps and Txs on different networks revokePermissions', function (this: Suite) {
  it('should close transaction for revoked permission of eth_accounts but show queued tx from second dapp on a different network.', async function () {
    const port = 8546;
    const chainId = 1338;
    const network1ChainId = '0x539'; // 1337
    const network2ChainId = '0x53a'; // 1338
    const hostname = 'Localhost 8546';

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);

        // Create TestDapp instances for both dapps
        const testDapp1 = new TestDapp(driver);
        const testDapp2 = new TestDapp(driver);

        // Open Dapp One
        await testDapp1.openTestDappPage({ url: DAPP_URL });

        // Connect to dapp 1
        await testDapp1.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await testDapp1.clickConnectAccountButtonAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await switchToNetworkFromSendFlow(driver, hostname);

        // Wait for the first dapp's connect confirmation to disappear
        await driver.waitUntilXWindowHandles(2);

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await testDapp2.openTestDappPage({ url: DAPP_ONE_URL });

        // Connect to dapp 2
        await testDapp2.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await testDapp2.clickConnectAccountButtonAndWaitForWindowToClose();

        // Dapp 1 send tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp1.checkNetworkIsConnected(network1ChainId);
        await testDapp1.clickSimpleSendButton();

        await driver.waitUntilXWindowHandles(4);
        await driver.delay(3000);

        // Dapp 2 send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await testDapp2.checkNetworkIsConnected(network2ChainId);
        await testDapp2.clickSimpleSendButton();
        await driver.waitUntilXWindowHandles(4);

        // Dapp 1 revokePermissions
        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp1.checkNetworkIsConnected(network1ChainId);

        // Verify that dapp 1 is not connected to network 2
        await testDapp1.checkDappIsNotConnectedToNetwork(network2ChainId);

        // Confirmation will close then reopen
        await testDapp1.clickRevokePermissionButton();
        // TODO: find a better way to handle different dialog ids
        await driver.delay(3000);

        // Check correct network on confirm tx.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await testDapp1.checkDappHostNetwork(hostname);
      },
    );
  });
});
