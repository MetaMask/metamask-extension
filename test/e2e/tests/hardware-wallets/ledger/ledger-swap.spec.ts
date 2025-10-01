import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { checkActivityTransaction } from '../../swaps/shared';

import HomePage from '../../../page-objects/pages/home/homepage';
import AdvancedSettings from '../../../page-objects/pages/settings/advanced-settings';
import SwapPage from '../../../page-objects/pages/swap/swap-page';

import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import { mockLedgerTransactionRequests } from './mocks';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

describe('Ledger Swap', function () {
  it('swaps ETH to DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withLedgerAccount().build(),
        localNodeOptions: {
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerTransactionRequests,
      },
      async ({ driver, localNodes }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x1158e460913d00000',
        )) ?? console.error('localNodes is undefined or empty');

        await loginWithBalanceValidation(driver, undefined, undefined, '20');

        const homePage = new HomePage(driver);

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

        if (isFirefox) {
          // firefox will open swap page in another tab with same name, so we need to close it
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.closeWindow();
        }

        // switch to the swap page tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();

        //  Occasionally, source token is not set automatically in e2e tests for some reason, so we need to do it manually
        await swapPage.selectSourceToken('TESTETH');

        await swapPage.enterSwapAmount('2');
        await swapPage.selectDestinationToken('DAI');
        await swapPage.dismissManualTokenWarning();

        await swapPage.checkSwapButtonIsEnabled();
        await swapPage.submitSwap();

        await swapPage.waitForTransactionToComplete();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.checkPageIsLoaded();
        // check activity list
        await homePage.goToActivityList();

        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});
