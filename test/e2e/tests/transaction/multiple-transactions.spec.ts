import { Driver } from '../../webdriver/driver';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { WINDOW_TITLES } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';

describe('Multiple transactions', function () {
  it('creates multiple queued transactions, then confirms', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // initiates a transaction from the dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // creates first transaction
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // creates second transaction
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // confirms second transaction
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkGasFee('0.0002');
        await transactionConfirmation.checkPageNumbers(1, 2);
        await transactionConfirmation.clickFooterConfirmButton();
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkGasFee('0.0002');
        await transactionConfirmation.checkNavigationIsNotPresent();

        // confirms first transaction
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // initiates a transaction from the dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // creates first transaction
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // creates second transaction
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // rejects second transaction
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkPageNumbers(1, 2);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkGasFee('0.0002');
        await transactionConfirmation.clickFooterCancelButton();
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkGasFee('0.0002');
        await transactionConfirmation.checkNavigationIsNotPresent();

        // rejects first transaction
        await transactionConfirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkNoTxInActivity();
      },
    );
  });
});
