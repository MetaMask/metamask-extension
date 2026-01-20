import { withFixtures, regularDelayMs } from '../../helpers';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import TestDapp from '../../page-objects/pages/test-dapp';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Multiple transactions', function () {
  it('creates multiple queued transactions, then confirms', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Open test dapp and initialize page objects
        await driver.openNewPage(DAPP_URL);
        const testDapp = new TestDapp(driver);

        // Create first transaction from the dapp
        await testDapp.clickSendEip1559WithoutGasButton();
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Create second transaction from the dapp
        await testDapp.clickSendEip1559WithoutGasButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new Confirmation(driver);

        // Confirm the second transaction (most recent)
        await confirmation.waitForRejectAllButton();
        await confirmation.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for the "Reject 2 transactions" link to disappear
        await confirmation.checkRejectAllTransactionsLinkNotPresent();

        // Confirm the first transaction
        await confirmation.clickFooterConfirmButton();

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.delay(regularDelayMs);

        // Navigate to activity list and verify both transactions are confirmed
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(2);
      },
    );
  });

  it('creates multiple queued transactions, then rejects', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Open test dapp and initialize page objects
        await driver.openNewPage(DAPP_URL);
        const testDapp = new TestDapp(driver);

        // Create first transaction from the dapp
        await testDapp.clickSendEip1559WithoutGasButton();
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Create second transaction from the dapp
        await testDapp.clickSendEip1559WithoutGasButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new Confirmation(driver);

        // Reject the second transaction (most recent)
        await confirmation.waitForRejectAllButton();
        await confirmation.clickFooterCancelButton();
        await confirmation.checkLoadingOverlaySpinnerNotPresent();

        // Reject the first transaction
        await confirmation.clickFooterCancelButton();

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.delay(regularDelayMs);

        // Navigate to activity list and verify no confirmed transactions
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        // Note: The previous isTransactionListEmpty wait already serves as the guard
        // here for the assertElementNotPresent check
        await activityListPage.checkNoConfirmedTransactions();
      },
    );
  });
});
