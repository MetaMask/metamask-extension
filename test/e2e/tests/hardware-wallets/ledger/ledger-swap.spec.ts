import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { checkActivityTransaction } from '../../swaps/shared';
import HomePage from '../../../page-objects/pages/home/homepage';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import { mockLedgerTransactionRequests } from './mocks';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

// This test is skipped because it needs to be migrated to the new swap flow
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Ledger Swap', function () {
  it('swaps ETH to DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerSmartTransactionsOptedOut()
          .withLedgerAccount()
          .build(),
        localNodeOptions: {
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
        },
        manifestFlags: {
          testing: { disableSmartTransactionsOverride: true },
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
        // To mitigate flakiness where the Swap page is re-rendered after submitting the swap (#36501)
        await driver.delay(5000);
        await swapPage.submitSwap();
        await swapPage.waitForTransactionToComplete();

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
