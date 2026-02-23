/**
 * Benchmark: Send transaction flow performance
 * Measures time for send flow from opening send page to confirmation
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import SnapTransactionConfirmation from '../../../page-objects/pages/confirmations/snap-transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  WITH_STATE_POWER_USER,
} from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

const RECIPIENT_ADDRESS = 'GxSJqxAyTjCjyDmPxdBBfVE9QwuMhEoHrPLRTmMyqxnU';

export const testTitle = 'benchmark-send-transactions-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

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
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: getTestSpecificMock(),
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
        const accountListPage = new AccountListPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await accountListPage.switchToAccount('Account 1');
        // Wait for Solana balance to load before starting the send flow
        if (shouldUseMockedRequests()) {
          await assetListPage.checkTokenAmountIsDisplayed('50 SOL');
        } else {
          await assetListPage.waitForTokenToBeDisplayed('SOL');
        }
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
        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount('0.00001');
        await sendPage.pressContinueButton();
        await timerReviewTransaction.measure(async () => {
          const confirmation = new SnapTransactionConfirmation(driver);
          await confirmation.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerReviewTransaction);
      },
    );

    return {
      timers: collectTimerResults(),
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runSendTransactionsBenchmark;
