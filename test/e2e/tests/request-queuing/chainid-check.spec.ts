import { strict as assert } from 'assert';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import FixtureBuilder from '../../fixture-builder';
import {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  regularDelayMs,
  WINDOW_TITLES,
} from '../../helpers';
import { PAGES } from '../../webdriver/driver';
import TestDapp from '../../page-objects/pages/test-dapp';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import type { Driver } from '../../webdriver/driver';

describe('Request Queueing chainId proxy sync', function () {
  it('should preserve per dapp network selections after connecting and switching without refresh calls', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withSelectedNetworkControllerPerDomain()
          .build(),
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
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        await driver.delay(regularDelayMs);

        const testDapp = new TestDapp(driver);

        // Get chain ID before connecting
        const chainIdBeforeConnect = await driver.executeScript(
          'return window.ethereum.request({method: "eth_chainId"})',
        );
        assert.equal(chainIdBeforeConnect, '0x539'); // 1337

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Get chain ID after manual network switch
        const chainIdBeforeConnectAfterManualSwitch =
          await driver.executeScript(
            'return window.ethereum.request({method: "eth_chainId"})',
          );

        // before connecting the chainId should change with the wallet
        assert.equal(chainIdBeforeConnectAfterManualSwitch, '0x1');

        // Connect to dapp
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Get chain ID after connecting
        const chainIdAfterConnect = await driver.executeScript(
          'return window.ethereum.request({method: "eth_chainId"})',
        );

        // should still be on the same chainId as the wallet after connecting
        assert.equal(chainIdAfterConnect, '0x1');

        // Switch network using wallet_switchEthereumChain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Handle review permissions dialog that appears for network switching
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.confirmReviewPermissions();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Get chain ID after dapp-initiated switch
        const chainIdAfterDappSwitch = await driver.executeScript(
          'return window.ethereum.request({method: "eth_chainId"})',
        );

        // should be on the new chainId that was requested
        assert.equal(chainIdAfterDappSwitch, '0x539'); // 1337

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await switchToNetworkFromSendFlow(driver, 'Localhost 8546');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Get chain ID after manual switch (should remain the same for connected dapp)
        const chainIdAfterManualSwitch = await driver.executeScript(
          'return window.ethereum.request({method: "eth_chainId"})',
        );

        // after connecting the dapp should now have its own selected network
        // independent from the globally selected and therefore should not have changed when
        // the globally selected network was manually changed via the wallet UI
        assert.equal(chainIdAfterManualSwitch, '0x539'); // 1337
      },
    );
  });
});
