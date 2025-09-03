import { Suite } from 'mocha';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import AddTokensModal from '../../page-objects/pages/dialog/add-tokens';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';

describe('Request Queue WatchAsset -> SwitchChain -> WatchAsset', function (this: Suite) {
  it('should not batch subsequent watchAsset token into first watchAsset confirmation with a switchChain in the middle', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDapp()
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
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // Create Token
        await testDapp.findAndClickCreateToken();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.clickFooterConfirmButton();

        // Wait for token address to populate in dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkTokenAddressesValue(
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );

        // Watch Asset 1st call
        await testDapp.clickAddTokenToWallet();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Handle potential Review Permissions dialog (appears in CI but not locally)
        try {
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const reviewPermissionsConfirmation =
            new ReviewPermissionsConfirmation(driver);
          // Short timeout to check if permissions dialog exists
          await driver.waitForSelector(
            { text: 'Review permissions', tag: 'h3' },
            { timeout: 3000 },
          );
          await reviewPermissionsConfirmation.confirmReviewPermissions();
        } catch (error) {
          // Permissions dialog doesn't appear (local environment)
          console.log('No permissions dialog found, continuing...');
        }

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Watch Asset 2nd call
        await testDapp.clickAddTokenToWallet();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for token to show in list of tokens to watch
        const addTokensModal = new AddTokensModal(driver);
        await addTokensModal.waitForSuggestedTokensCount(2);

        // Confirm only 2 tokens are present in suggested token list
        await addTokensModal.checkSuggestedTokensCount(2);
      },
    );
  });
});
