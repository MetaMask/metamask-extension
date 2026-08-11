import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';

pwTest.describe('Clear account activity', () => {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // When user get stuck with pending transactions, one can reset the account by clicking the 'Clear activity tab data' //
  // button in settings, developer tools tab. This functionality will clear all the transactions history.               //
  // Note that it only only affects the current network.                                                                //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  pwTest(
    'User can clear account activity via the developer tools tab, ',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withTransactionControllerCompletedTransaction()
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });

          // Check local "Sent" transaction history is displayed
          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityTab = new ActivityTab(driver);
          await activityTab.checkTxAction({
            action: 'Sent ETH',
            confirmedTx: 1,
          });

          // Clear activity and nonce data
          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToDeveloperOptions();
          await settingsPage.clickDeveloperOptionsDeleteActivityAndNonceData();
          await settingsPage.confirmDeleteActivityAndNonceModal();
          await closeSettings(driver);

          await activityTab.checkNoTxInActivity();
        },
      );
    },
  );
});
