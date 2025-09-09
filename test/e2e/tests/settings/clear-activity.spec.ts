import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import ActivityList from '../../page-objects/pages/home/activity-list';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Clear account activity', function (this: Suite) {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // When user get stuck with pending transactions, one can reset the account by clicking the 'Clear activity tab data' //
  // button in settings, advanced tab. This functionality will clear all the transactions history.                      //
  // Note that it only only affects the current network.                                                                //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('User can clear account activity via the advanced setting tab, ', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerCompletedAndIncomingTransaction()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Check send transaction and receive transaction history are all displayed
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityList(driver);
        await activityList.checkTxAction({ action: 'Received', totalTx: 2 });
        await activityList.checkTxAction({
          action: 'Sent',
          txIndex: 2,
          totalTx: 2,
        });

        // Clear activity and nonce data
        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettings = new AdvancedSettings(driver);
        await advancedSettings.checkPageIsLoaded();
        await advancedSettings.clearActivityTabData();
        await settingsPage.closeSettingsPage();

        await activityList.checkNoTxInActivity();
      },
    );
  });
});
