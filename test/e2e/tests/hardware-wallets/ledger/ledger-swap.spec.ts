import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';

import HomePage from '../../../page-objects/pages/home/homepage';
import AdvancedSettings from '../../../page-objects/pages/settings/advanced-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { checkActivityTransaction } from '../../swaps/shared';

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

        // switch windows back to ExtensionInFullScreenView to avoid the issue of the window being closed
        await driver.delay(5000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();
        await swapPage.enterSwapAmount('2');
        await swapPage.selectDestinationToken('DAI');

        await swapPage.dismissManualTokenWarning();
        await driver.delay(1500);
        await swapPage.submitSwap();

        await swapPage.waitForTransactionToComplete();

        // check activity list
        await homePage.goToActivityList();

        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
        console.log('Ledger swap transaction completed successfully');
      },
    );
  });
});
