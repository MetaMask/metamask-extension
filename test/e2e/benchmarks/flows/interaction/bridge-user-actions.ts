/**
 * Benchmark: Bridge User Actions
 * Measures bridge page load, asset picker load, and token search time
 *
 * `bridge_load_page` is app-clocked: its timer reads the app's own
 * `TraceName.SwapViewLoaded` span out of the mocked Sentry envelopes instead
 * of the harness stopwatch. `SwapViewLoaded` is the bridge screen's span --
 * swap and bridge are one unified feature, and `useBridgeNavigation.ts` starts
 * it with `op: TraceOperation.BridgeScreenPerformance` -- while
 * `TraceName.BridgeViewLoaded` is a vestigial enum member with no call sites.
 *
 * The other two steps stay harness-clocked; each carries a comment naming the
 * span that does not exist.
 */

import { Mockttp, MockedEndpoint } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import BridgeQuotePage from '../../../page-objects/pages/bridge/quote-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import {
  DEFAULT_BRIDGE_FEATURE_FLAGS,
  MOCK_TOKENS_ETHEREUM,
} from '../../../tests/bridge/constants';
import { Driver } from '../../../webdriver/driver';
import { buildLongTaskTimerResults } from '../../utils/long-task-helper';
import {
  sentryTimerResult,
  waitForSentryTransactions,
} from '../../utils/sentry-transactions';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
} from '../../../../../shared/constants/benchmarks';
import { TraceName } from '../../../../../shared/lib/trace';
import { runUserActionBenchmark, collectWebVitals } from '../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';

export const testTitle = 'benchmark-user-actions-bridge-user-actions';
export const persona = BENCHMARK_PERSONA.STANDARD;

/**
 * Mirrors `sentryRegEx` exported from test/e2e/helpers.js, minus the `g` flag:
 * a global regex keeps `lastIndex` state across `.test()` calls, which makes
 * matching intermittent when the matcher is reused. Matches both the default
 * DSN and SENTRY_DSN_PERFORMANCE, which is where tracing envelopes are posted.
 */
const SENTRY_ENVELOPE_RE = /^https:\/\/sentry\.io\/api\/\d+\/envelope/u;

async function mockBridgeBenchmark(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const tokenSearch = await mockServer
    .forPost(/getTokens\/search/u)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          data: MOCK_TOKENS_ETHEREUM.map((token) => ({
            ...token,
            assetId: `eip155:1/erc20:${token.address.toLowerCase()}`,
            chainId: 'eip155:1',
          })),
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      };
    });

  // mock-e2e.js registers canned envelope rules but discards their handles, so
  // nothing downstream can read them. Register our own at a higher priority and
  // return it, so the spans land on an endpoint we can read seen-requests from.
  // Same technique as test/e2e/tests/bridge/swap-input-trace-batch.spec.ts.
  const sentryEnvelopes = await mockServer
    .forPost(SENTRY_ENVELOPE_RE)
    .always()
    .asPriority(100)
    .thenCallback(() => {
      return { statusCode: 200, json: {} };
    });

  return [tokenSearch, sentryEnvelopes];
}

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadPage: number = 0;
    let loadAssetPicker: number = 0;
    let searchToken: number = 0;
    const steps: LongTaskStepResult[] = [];
    let sentryTimers: ReturnType<typeof sentryTimerResult>[] = [];
    let webVitals;

    const fixtureBuilder = new FixtureBuilderV2().withEnabledNetworks({
      eip155: { '0x1': true },
    });

    await withFixtures(
      {
        fixtures: fixtureBuilder.build(),
        disableServerMochaToBackground: true,
        testSpecificMock: mockBridgeBenchmark,
        title: testTitle,
        manifestFlags: {
          remoteFeatureFlags: {
            bridgeConfig: DEFAULT_BRIDGE_FEATURE_FLAGS,
          },
          // Sample every trace, so the bridge span reaches the mocked Sentry
          // endpoint this benchmark reads it from. CI builds otherwise send
          // only a small fraction of traces. Placement follows the pilot's
          // swap.ts and test/e2e/tests/bridge/swap-input-trace-batch.spec.ts.
          sentry: { tracesSampleRate: 1 },
        },
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        const quotePage = new BridgeQuotePage(driver);

        // Harness duration is still recorded here so the long-task metrics stay
        // associated with the step; the emitted timer is replaced below by the
        // app's own SwapViewLoaded span.
        await driver.resetLongTaskMetrics();
        const timestampBeforeLoadPage = new Date();
        await homePage.startSwapFlow();
        const timestampAfterLoadPage = new Date();
        loadPage =
          timestampAfterLoadPage.getTime() - timestampBeforeLoadPage.getTime();
        let longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'bridge_load_page',
          duration: loadPage,
          longTaskCount: longTaskData?.count ?? 0,
          longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
          longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
          tbt: longTaskData?.tbt ?? 0,
        });

        // Harness-clocked: no app span exists for the bridge asset picker.
        // Neither ui/pages/bridge/asset-picker/ nor
        // ui/components/multichain/asset-picker-amount/ emits a trace.
        await driver.resetLongTaskMetrics();
        const timestampBeforeClickAssetPicker = new Date();
        await driver.clickElement(quotePage.sourceAssetPickerButton);
        const timestampAfterClickAssetPicker = new Date();
        loadAssetPicker =
          timestampAfterClickAssetPicker.getTime() -
          timestampBeforeClickAssetPicker.getTime();
        longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'bridge_load_asset_picker',
          duration: loadAssetPicker,
          longTaskCount: longTaskData?.count ?? 0,
          longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
          longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
          tbt: longTaskData?.tbt ?? 0,
        });

        // Harness-clocked: no app span exists for token search. The nearest
        // live span, TraceName.SwapQuoteFetch, measures quote fetching rather
        // than the search input, so it would not be measuring this step.
        const tokenToSearch = 'FXS';
        await driver.resetLongTaskMetrics();
        const timestampBeforeTokenSearch = new Date();
        await driver.fill(quotePage.assetPrickerSearchInput, tokenToSearch);
        await driver.waitForSelector({
          text: tokenToSearch,
          css: quotePage.tokenButton,
        });
        const timestampAfterTokenSearch = new Date();
        searchToken =
          timestampAfterTokenSearch.getTime() -
          timestampBeforeTokenSearch.getTime();
        longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'bridge_search_token',
          duration: searchToken,
          longTaskCount: longTaskData?.count ?? 0,
          longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
          longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
          tbt: longTaskData?.tbt ?? 0,
        });

        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }

        // Read the app's own bridge-view-load span. Runs after the interactions
        // so the envelope has had the whole flow to flush.
        const transactions = await waitForSentryTransactions(
          driver,
          mockedEndpoint,
          [TraceName.SwapViewLoaded],
        );
        sentryTimers = [
          sentryTimerResult(
            transactions,
            TraceName.SwapViewLoaded,
            'bridge_load_page',
          ),
        ];
      },
    );

    return {
      timers: [
        // bridge_load_page is app-clocked from SwapViewLoaded; the other two
        // ids keep their harness durations. `steps` still carries all three so
        // the long-task results are unchanged.
        ...sentryTimers,
        ...steps
          .filter((s) => s.id !== 'bridge_load_page')
          .map((s) => ({ id: s.id, value: s.duration })),
        ...buildLongTaskTimerResults(steps),
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
