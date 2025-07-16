import { Suite } from 'mocha';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import AlertModal from '../../page-objects/pages/confirmations/redesign/alert-modal';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

describe('Request Queuing Send Tx -> SwitchChain -> SendTx', function (this: Suite) {
  it('switching network should reject pending confirmations', async function () {
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

        // Dapp Send Button
        await testDapp.clickSimpleSendButton();

        // Navigate back to test dapp
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

        // Navigate back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Dapp Send Button
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.clickNextPage();

        // Confirm Switch Chain
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButton();

        const alertModal = new AlertModal(driver);
        await alertModal.clickConfirmButton();

        // No confirmations, after switching network, tx queue should be cleared
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_noTxInActivity();
      },
    );
  });
});
