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
  describeSpanBreakdown,
  readSentryTransactions,
  sentryCountResult,
  sentryTimerResult,
  waitForSentryTransactions,
} from '../../utils/sentry-transactions';
import { TraceName } from '../../../../../shared/lib/trace';
import {
  measureStepWithLongTasks,
  buildLongTaskTimerResults,
} from '../../utils/long-task-helper';
import { measureStepInPage } from '../../utils/in-page-step-timer';
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

/**
 * The chart header's percent change, rendered only once real historical prices
 * load (`asset-chart.tsx`, `token-price-header.tsx`). It never appears unless
 * the historical-prices mock matches the URL the chart requests.
 */
const PRICE_CHART_DATA =
  '[data-testid="parent-selector-asset-details"] [data-testid="asset-price-percent-change"]';

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

        // Measure: Asset click to the price chart's data. Both timers end at
        // `PRICE_CHART_DATA`, not at the asset page's first render, which is
        // where the chart container and the balance row's percentage already
        // are. `clickOnAsset` may first expand the low-value section, so the
        // in-page timer starts only on input inside a token row.
        inPageTimers.push(
          ...(await measureStepInPage(driver, 'assetClickToPriceChart', {
            endSelector: PRICE_CHART_DATA,
            startWithin: '[data-testid="multichain-token-list-button"]',
            trigger: () => tokensTab.clickOnAsset('Solana'),
            settle: async () => {
              steps.push(
                await measureStepWithLongTasks(
                  driver,
                  'assetClickToPriceChart',
                  async () => {
                    await tokensTab.checkPriceChartIsShown();
                    await driver.waitForSelector(PRICE_CHART_DATA);
                  },
                  { legacyTimerId: true },
                ),
              );
            },
          })),
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

        // Diagnostic only: log the child spans of this iteration's
        // `Asset Details` span. Read last, so a later-ending span has been sent.
        try {
          console.log(
            `[benchmark] ${describeSpanBreakdown(
              await readSentryTransactions(mockedEndpoint),
              TraceName.AssetDetails,
            )}`,
          );
        } catch (error) {
          console.error('Error reading the Asset Details child spans:', error);
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
