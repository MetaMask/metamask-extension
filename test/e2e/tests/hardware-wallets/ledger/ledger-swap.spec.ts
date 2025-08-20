import FixtureBuilder from '../../../fixture-builder';
import { ACCOUNT_1, withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import AdvancedSettings from '../../../page-objects/pages/settings/advanced-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { mockLedgerTransactionRequests } from './mocks';

describe('Ledger Swap', function () {
  it('swaps ETH to DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withLedgerAccount(ACCOUNT_1)
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerTransactionRequests,
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 1,
              hardfork: 'london',
              loadState: './test/e2e/seeder/network-states/with50Dai.json',
            },
          },
        ],
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkExpectedTokenBalanceIsDisplayed('20', 'ETH');

        // disable smart transactions
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);

        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.toggleSmartTransactions();
        await settingsPage.closeSettingsPage();

        await homePage.checkIfSwapButtonIsClickable();
        await homePage.startSwapFlow();

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();
        await swapPage.enterSwapAmount('2');
        await swapPage.selectDestinationToken('DAI');

        await swapPage.dismissManualTokenWarning();
        await driver.delay(1500);
        await swapPage.submitSwap();

        await swapPage.waitForTransactionToComplete();

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkNoFailedTransactions();
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAction('Swap ETH to DAI', 1);
        await activityList.checkTxAmountInActivity(`-2 ETH`, 1);
      },
    );
  });
});
