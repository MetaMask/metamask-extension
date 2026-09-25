/**
 * Benchmark: Solana asset details page load for power user
 * Measures time to load price chart for SOL token
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import type { MockedEndpoint } from '../../../mock-e2e';
import { login } from '../../../page-objects/flows/login.flow';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults } from '../../utils/timer-helper';
import {
  sentryCountResult,
  sentryTimerResult,
  waitForSentryTransactions,
} from '../../utils/sentry-transactions';
import { TraceName } from '../../../../../shared/lib/trace';
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
import type {
  BenchmarkRunResult,
  LongTaskStepResult,
  TimerResult,
} from '../../utils/types';

const SOL_TOKEN_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export const testTitle = 'benchmark-solana-asset-details-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runSolanaAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  const traceTimers: TimerResult[] = [];
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
          // Sample every trace, so the `Asset Details` span reaches the mocked
          // Sentry endpoint this benchmark reads it from. CI builds otherwise
          // send only a small fraction of traces.
          sentry: { tracesSampleRate: 1 },
        },
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: getTestSpecificMock(),
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        // Login flow
        await login(driver, { validateBalance: false });
        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenListIsDisplayed();

        await tokensTab.clickOnAsset('Solana');
        // Measure: Asset click to price chart loaded
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'assetClickToPriceChart',
            async () => {
              await tokensTab.checkPriceChartIsShown();
              await tokensTab.checkPriceChartLoaded(SOL_TOKEN_ADDRESS);
            },
          ),
        );

        // The app's own span over this journey, as the Sentry SDK sent it,
        // timed on the browser's clock (extension#46006 ([P0] Benchmark step
        // timers measure the test harness, not the browser)).
        //
        // `Asset Details` is NOT coextensive with `assetClickToPriceChart`:
        // it starts in `onTokenClick` (so it includes the click the step
        // timer starts after) and ends when `asset-page` mounts, BEFORE the
        // price chart's historical-price data has rendered. It therefore
        // measures navigation only, and is reported under its own id rather
        // than as a replacement for the step timer. Report-only: no threshold
        // is registered for it.
        const transactions = await waitForSentryTransactions(
          driver,
          mockedEndpoint,
          [TraceName.AssetDetails],
        );
        traceTimers.push(
          sentryTimerResult(
            transactions,
            TraceName.AssetDetails,
            'assetDetails',
          ),
          sentryCountResult(
            transactions,
            TraceName.AssetDetails,
            'assetDetailsCount',
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
      timers: [
        ...collectTimerResults(),
        ...buildLongTaskTimerResults(steps),
        ...traceTimers,
      ],
      webVitals,
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: [
        ...collectTimerResults(),
        ...buildLongTaskTimerResults(steps),
        ...traceTimers,
      ],
      webVitals,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runSolanaAssetDetailsBenchmark;
