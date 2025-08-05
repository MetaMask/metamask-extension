import { Suite } from 'mocha';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { DAPP_URL } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';

describe('Request Queue SwitchChain -> WatchAsset', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.HST;
  it('should not clear subsequent watchAsset after switching chain', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
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
        smartContract,
        title: this.test?.fullTitle(),
      },

      async ({ driver, contractRegistry, localNodes }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        // Disconnect Localhost 8545. By Default, this was the globally selected network
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.clickDisconnectNetwork(
          'Localhost 8545',
        );
        await reviewPermissionsConfirmation.clickConnectMoreChainsButton();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await reviewPermissionsConfirmation.check_useEnabledNetworksMessageIsDisplayed();

        // Switch back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();

        // Watch Asset
        await testDapp.clickAddTokenToWallet();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm Switch Network
        await reviewPermissionsConfirmation.check_pageIsLoaded();
        await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButton();

        await driver.waitUntilXWindowHandles(3);
      },
    );
  });
});
