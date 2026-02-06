/**
 * Benchmark: Send transaction flow performance
 * Measures time for send flow from opening send page to confirmation
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { openAccountMenuAndSwitchToAccount } from '../../../page-objects/flows/account-list.flow';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import {
  fillSendFormAndPressContinue,
  waitForSnapTransactionConfirmation,
} from '../../../page-objects/flows/send-transaction.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import { WITH_STATE_POWER_USER } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const RECIPIENT_ADDRESS = 'GxSJqxAyTjCjyDmPxdBBfVE9QwuMhEoHrPLRTmMyqxnU';

export const testTitle = 'benchmark-send-transactions-power-user';
export const persona = 'powerUser';

export async function runSendTransactionsBenchmark(): Promise<BenchmarkRunResult> {
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
        const timerOpenSendPage = new TimerHelper('openSendPageFromHome');
        const timerAssetPicker = new TimerHelper('selectTokenToSendFormLoaded');
        const timerReviewTransaction = new TimerHelper(
          'reviewTransactionToConfirmationPage',
        );

        // Login flow
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await openAccountMenuAndSwitchToAccount(driver, 'Account 1');
        // Measure: Open send page
        await homePage.startSendFlow();
        await timerOpenSendPage.measure(async () => {
          const sendPage = new SendPage(driver);
          await sendPage.checkNetworkFilterToggleIsDisplayed();
        });
        performanceTracker.addTimer(timerOpenSendPage);

        // Measure: Select token and load form
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'SOL',
        );
        await timerAssetPicker.measure(async () => {
          await sendPage.checkSendFormIsLoaded();
        });
        performanceTracker.addTimer(timerAssetPicker);

        // Measure: Review transaction
        await fillSendFormAndPressContinue(sendPage, RECIPIENT_ADDRESS, '0.00001');
        await timerReviewTransaction.measure(async () => {
          await waitForSnapTransactionConfirmation(driver);
        });
        performanceTracker.addTimer(timerReviewTransaction);
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
