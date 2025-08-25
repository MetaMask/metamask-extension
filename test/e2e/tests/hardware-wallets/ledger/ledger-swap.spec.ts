import FixtureBuilder from '../../../fixture-builder';
import { withFixtures } from '../../../helpers';
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
        fixtures: new FixtureBuilder().withLedgerAccount().build(),
        localNodeOptions: {
          hardfork: 'london',
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerTransactionRequests,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedTokenBalanceIsDisplayed('20', 'ETH');

        // Mock platform.openExtensionInBrowser to navigate in the same window for testing
        await driver.executeScript(() => {
          window.global = window.global || {};
          window.global.platform = window.global.platform || {};
          window.global.platform.openExtensionInBrowser = (route) => {
            // Instead of opening a new window, navigate in the current window
            if (route) {
              window.location.hash = route;
            }
          };
        });

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

        console.log('Ledger swap transaction completed successfully');
      },
    );
  });
});
