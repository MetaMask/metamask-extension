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
import { buildLongTaskTimerResults } from '../../utils/long-task-helper';
import { getSentryTransactionManifestFlags } from '../../utils/sentry-transaction-flags';
import { measureAssetClickToPriceChart } from '../../utils/asset-price-chart-step';
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

export const testTitle = 'benchmark-solana-asset-details-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runSolanaAssetDetailsBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  const traceTimers: TimerResult[] = [];
  const inPageTimers: TimerResult[] = [];
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
          // The `Asset Details` span must reach the mocked Sentry endpoint this
          // benchmark reads it from.
          ...getSentryTransactionManifestFlags(),
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

        // Measure: Asset click to the price chart's data.
        inPageTimers.push(
          ...(await measureAssetClickToPriceChart(
            driver,
            tokensTab,
            'Solana',
            steps,
          )),
        );

        // `Asset Details` ends at the asset page's mount, before the chart data
        // where `assetClickToPriceChart` ends, so it is reported under its own
        // id and has no threshold.
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
        ...inPageTimers,
      ],
      expectedTimers: ['assetClickToPriceChart'],
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
        ...inPageTimers,
      ],
      webVitals,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runSolanaAssetDetailsBenchmark;
