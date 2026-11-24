/**
 * Benchmark: Bridge User Actions
 * Measures bridge page load, asset picker load, and token search time
 */

import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import SwapAssetPickerPage from '../../../page-objects/pages/swap/swap-asset-picker-page';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import {
  DEFAULT_BRIDGE_FEATURE_FLAGS,
  MOCK_TOKENS_ETHEREUM,
} from '../../../tests/bridge/constants';
import { Driver } from '../../../webdriver/driver';
import { buildLongTaskTimerResults } from '../../utils/long-task-helper';
import {
  KNOWN_ANSWER_TOKEN_SEARCH_DELAY,
  withKnownAnswerDelay,
} from '../../mocks/known-answer';
import { WARMUP_RUNS } from '../../utils/constants';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
} from '../../../../../shared/constants/benchmarks';
import { runUserActionBenchmark, collectWebVitals } from '../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';

export const testTitle = 'benchmark-user-actions-bridge-user-actions';
export const persona = BENCHMARK_PERSONA.STANDARD;

async function mockTokensEthereum(mockServer: Mockttp) {
  return await mockServer.forPost(/getTokens\/search/u).thenCallback(
    withKnownAnswerDelay(KNOWN_ANSWER_TOKEN_SEARCH_DELAY, () => ({
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
    })),
  );
}

/**
 * Run this flow at {@link BRIDGE_SCORED_ITERATIONS} scored iterations after the
 * warm-up instead of `--iterations`. Off unless set to `1`.
 */
export const BRIDGE_17_ITERATIONS = 'BENCHMARK_BRIDGE_17_ITERATIONS';

/** The iterations scored when {@link BRIDGE_17_ITERATIONS} is on. */
export const BRIDGE_SCORED_ITERATIONS = 16;

/**
 * This flow's iteration count, read by `run-benchmark.ts`.
 * @returns 17 (scored iterations plus the warm-up) when
 * `BENCHMARK_BRIDGE_17_ITERATIONS=1`, else `undefined`.
 */
export function iterations(): number | undefined {
  return process.env[BRIDGE_17_ITERATIONS] === '1'
    ? BRIDGE_SCORED_ITERATIONS + WARMUP_RUNS
    : undefined;
}

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadPage: number = 0;
    let loadAssetPicker: number = 0;
    let searchToken: number = 0;
    const steps: LongTaskStepResult[] = [];
    let webVitals;

    const fixtureBuilder = new FixtureBuilderV2().withEnabledNetworks({
      eip155: { '0x1': true },
    });

    await withFixtures(
      {
        fixtures: fixtureBuilder.build(),
        disableServerMochaToBackground: true,
        testSpecificMock: mockTokensEthereum,
        title: testTitle,
        manifestFlags: {
          remoteFeatureFlags: {
            bridgeConfig: DEFAULT_BRIDGE_FEATURE_FLAGS,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        const assetPickerPage = new SwapAssetPickerPage(driver);

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

        await driver.resetLongTaskMetrics();
        const timestampBeforeClickAssetPicker = new Date();
        await swapPage.openAssetPicker('source');
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

        const tokenToSearch = 'FXS';
        await driver.resetLongTaskMetrics();
        const timestampBeforeTokenSearch = new Date();
        await driver.fill(assetPickerPage.searchInput, tokenToSearch);
        await driver.waitForSelector({
          text: tokenToSearch,
          css: assetPickerPage.tokenButton,
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
      },
    );

    return {
      timers: [
        ...steps.map((s) => ({ id: s.id, value: s.duration })),
        ...buildLongTaskTimerResults(steps),
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
