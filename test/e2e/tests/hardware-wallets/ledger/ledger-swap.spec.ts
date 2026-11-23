import { Suite } from 'mocha';
import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { enterBridgeQuote } from '../../../page-objects/flows/bridge.flow';
import { login } from '../../../page-objects/flows/login.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HardwareWalletSignaturesPage from '../../../page-objects/pages/hardware-wallet/hardware-wallet-signatures-page';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import {
  getLedgerSwapFixtures,
  LEDGER_SWAP_EXPECTED_FIAT_BALANCE,
  LEDGER_SWAP_MAINNET_ETH_WEI,
} from './fixtures';

describe('Ledger Swap', function (this: Suite) {
  it('swaps ETH to DAI', async function () {
    await withFixtures(
      getLedgerSwapFixtures(this.test?.fullTitle()),
      async ({ driver, localNodes }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          LEDGER_SWAP_MAINNET_ETH_WEI,
        )) ?? console.error('localNodes is undefined or empty');

        await login(driver, {
          expectedBalance: LEDGER_SWAP_EXPECTED_FIAT_BALANCE,
        });

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const swapPage = new SwapPage(driver);
        await enterBridgeQuote(driver, {
          amount: '2',
          tokenTo: 'DAI',
        });
        await swapPage.waitForQuote();
        // Plain submit: the signing page appears immediately, so any wait for a
        // confirmation modal here would miss it.
        await swapPage.submitQuote();

        const hardwareWalletSignaturesPage = new HardwareWalletSignaturesPage(
          driver,
        );
        await hardwareWalletSignaturesPage.checkPageIsLoaded();
        await hardwareWalletSignaturesPage.waitForPageToClose();

        await swapPage.goBackAfterSubmit();
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedTxNumberDisplayedInActivity();
        await activityTab.checkNoFailedTransactions();
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
        await activityTab.checkTxAction({ action: 'Swapped' });
        await activityTab.checkTxAmountInActivity(`+4,625.9799 DAI`, 1);
      },
    );
  });
});
