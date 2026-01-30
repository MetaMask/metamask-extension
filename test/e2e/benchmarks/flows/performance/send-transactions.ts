/**
 * Benchmark: Send transaction flow performance
 * Measures time for send flow from opening send page to confirmation
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/login-page';
import SendPage from '../../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../../page-objects/pages/confirmations/snap-transaction-confirmation';
import { Driver } from '../../../webdriver/driver';
import TimerHelper from '../../utils/TimerHelper';
import Timers from '../../utils/Timers';
import { collectTimerResults } from '../../utils/timer-utils';
import { WITH_STATE_POWER_USER } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const RECIPIENT_ADDRESS = 'GxSJqxAyTjCjyDmPxdBBfVE9QwuMhEoHrPLRTmMyqxnU';

export const testTitle = 'benchmark-send-transactions-power-user';
export const persona = 'powerUser';

export async function runSendTransactionsBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

  try {
    await withFixtures(
      {
        title: testTitle,
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
      },
      async ({ driver }: { driver: Driver }) => {
        // Login flow
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();

        // Timer: Open send page
        const timerOpenSendPage = new TimerHelper('openSendPageFromHome', 3000);
        await homePage.startSendFlow();
        await timerOpenSendPage.measure(async () => {
          const sendPage = new SendPage(driver);
          await sendPage.checkNetworkFilterToggleIsDisplayed();
        });

        // Timer: Select token and load form
        const timerAssetPicker = new TimerHelper(
          'selectTokenToSendForm',
          2000,
        );
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqsZKvdp',
          'SOL',
        );
        await timerAssetPicker.measure(async () => {
          await sendPage.checkSendFormIsLoaded();
        });

        // Timer: Review transaction
        const timerReviewTransaction = new TimerHelper(
          'reviewTransactionToConfirmationScreen',
          5000,
        );
        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount('0.00001');
        await sendPage.pressContinueButton();
        await timerReviewTransaction.measure(async () => {
          const confirmation = new SnapTransactionConfirmation(driver);
          await confirmation.checkPageIsLoaded();
        });
      },
    );

    return { timers: collectTimerResults(), success: true };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run = runSendTransactionsBenchmark;
