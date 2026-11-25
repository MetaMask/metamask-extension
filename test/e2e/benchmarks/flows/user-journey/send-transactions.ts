/**
 * Benchmark: Send transaction flow performance
 * Measures time for send flow from opening send page to confirmation
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import SnapTransactionConfirmation from '../../../page-objects/pages/confirmations/snap-transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendAmountRecipientPage from '../../../page-objects/pages/send/send-amount-recipient-page';
import SendAssetPickerPage from '../../../page-objects/pages/send/send-asset-picker-page';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults } from '../../utils/timer-helper';
import {
  measureStepWithLongTasks,
  buildLongTaskTimerResults,
} from '../../utils/long-task-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  type WebVitalsMetrics,
} from '../../../../../shared/constants/benchmarks';
import { WITH_STATE_POWER_USER } from '../../utils/constants';
import { collectWebVitals } from '../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';
import { openAccountMenu } from '../../../page-objects/flows/account-menu.flow';

const RECIPIENT_ADDRESS = 'GxSJqxAyTjCjyDmPxdBBfVE9QwuMhEoHrPLRTmMyqxnU';

export const testTitle = 'benchmark-send-transactions-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runSendTransactionsBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  let webVitals: WebVitalsMetrics | undefined;
  try {
    await withFixtures(
      {
        title: testTitle,
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          testing: {
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: getTestSpecificMock(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Login flow
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenListIsDisplayed();
        const accountListPage = new AccountListPage(driver);
        await openAccountMenu(driver);
        await accountListPage.switchToAccount('Account 1');
        // Wait for Solana balance to load before starting the send flow
        if (shouldUseMockedRequests()) {
          await tokensTab.checkTokenAmountIsDisplayed('50 SOL');
        } else {
          await tokensTab.waitForTokenToBeDisplayed('SOL');
        }

        // Measure: Open send page
        await homePage.startSendFlow();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'openSendPageFromHome',
            async () => {
              const sendAssetPickerPage = new SendAssetPickerPage(driver);
              await sendAssetPickerPage.checkNetworkFilterToggleIsDisplayed();
            },
          ),
        );

        // Measure: Select token and load form
        const sendAssetPickerPage = new SendAssetPickerPage(driver);
        await sendAssetPickerPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'SOL',
        );
        const sendAmountRecipientPage = new SendAmountRecipientPage(driver);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'selectTokenToSendFormLoaded',
            async () => {
              await sendAmountRecipientPage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Review transaction
        await sendAmountRecipientPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });
        await sendAmountRecipientPage.fillAmount('0.00001');
        await sendAmountRecipientPage.pressContinueButton();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'reviewTransactionToConfirmationPage',
            async () => {
              const confirmation = new SnapTransactionConfirmation(driver);
              await confirmation.checkPageIsLoaded();
            },
          ),
        );

        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
      },
    );

    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      webVitals,
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      webVitals,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runSendTransactionsBenchmark;
