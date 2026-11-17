/**
 * Benchmark: Bridge User Actions
 * Measures bridge page load, asset picker load, and token search time
 */

import { Mockttp } from 'mockttp';
import { Key } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import BridgeQuotePage from '../../../page-objects/pages/bridge/quote-page';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import {
  DEFAULT_BRIDGE_FEATURE_FLAGS,
  MOCK_TOKENS_ETHEREUM,
} from '../../../tests/bridge/constants';
import { Driver } from '../../../webdriver/driver';
import {
  buildLongTaskTimerResults,
  legacyStepTimerId,
} from '../../utils/long-task-helper';
import {
  KNOWN_ANSWER_TOKEN_SEARCH_DELAY,
  withKnownAnswerDelay,
} from '../../mocks/known-answer';
import bridgeTokensPopular from '../../mocks/bridge-tokens-popular.json';
import {
  IN_PAGE_DESTINATIONS,
  finishInPageStep,
  startInPageStep,
} from '../../utils/in-page-step-timer';
import { WARMUP_RUNS } from '../../utils/constants';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
} from '../../../../../shared/constants/benchmarks';
import { runUserActionBenchmark, collectWebVitals } from '../../utils';
import type {
  BenchmarkRunResult,
  LongTaskStepResult,
  TimerResult,
} from '../../utils/types';

export const testTitle = 'benchmark-user-actions-bridge-user-actions';
export const persona = BENCHMARK_PERSONA.STANDARD;

const FXS_ADDRESS = MOCK_TOKENS_ETHEREUM.find(
  (token) => token.symbol === 'FXS',
)?.address;

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
 * Serve the swap flow's popular-token list. Without it the default mock answers
 * an empty 200, the app fails to parse it, and `withFixtures` fails those
 * iterations. On unless set to `0`.
 */
export const BRIDGE_POPULAR_TOKENS_MOCK =
  'BENCHMARK_BRIDGE_POPULAR_TOKENS_MOCK';

async function mockPopularTokens(mockServer: Mockttp) {
  return await mockServer
    .forPost(/getTokens\/popular/u)
    .thenCallback(() => ({ statusCode: 200, json: bridgeTokensPopular }));
}

async function mockBridgeEndpoints(mockServer: Mockttp) {
  const endpoints = [await mockTokensEthereum(mockServer)];
  if (process.env[BRIDGE_POPULAR_TOKENS_MOCK] !== '0') {
    endpoints.push(await mockPopularTokens(mockServer));
  }
  return endpoints;
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

/**
 * Before the asset-picker step, wait for two consecutive idle periods of the
 * page: see {@link waitForPageIdleBeforeStep}. Off unless set to `1`.
 */
export const PAGE_IDLE_BEFORE_STEP = 'BENCHMARK_PAGE_IDLE_BEFORE_STEP';

/**
 * Call `done` after two consecutive idle periods. Serialized into the page by
 * `executeAsyncScript`, which passes `done` second, so it may reference only
 * its body and globals on every build's LavaMoat scuttling exception list.
 */
export function resolveAfterTwoIdlePeriods(
  _args: unknown,
  done: (result: null) => void,
): void {
  requestIdleCallback(() => {
    requestIdleCallback(() => done(null));
  });
}

/**
 * When `BENCHMARK_PAGE_IDLE_BEFORE_STEP=1`, wait for two consecutive idle
 * periods; call it before the step's probe and trigger, outside its timers. A
 * page that never idles fails at the script timeout rather than start busy.
 */
export async function waitForPageIdleBeforeStep(driver: Driver): Promise<void> {
  if (process.env[PAGE_IDLE_BEFORE_STEP] !== '1') {
    return;
  }
  await driver.executeAsyncScript(resolveAfterTwoIdlePeriods);
}

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadPage: number = 0;
    let loadAssetPicker: number = 0;
    let searchToken: number = 0;
    const steps: LongTaskStepResult[] = [];
    const inPageTimers: TimerResult[] = [];
    let webVitals;

    const fixtureBuilder = new FixtureBuilderV2().withEnabledNetworks({
      eip155: { '0x1': true },
    });

    await withFixtures(
      {
        fixtures: fixtureBuilder.build(),
        disableServerMochaToBackground: true,
        testSpecificMock: mockBridgeEndpoints,
        title: testTitle,
        manifestFlags: {
          remoteFeatureFlags: {
            bridgeConfig: DEFAULT_BRIDGE_FEATURE_FLAGS,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const quotePage = new BridgeQuotePage(driver);

        // Wait for the input's target and clear the search field before the
        // timer starts, so it holds only the input and the page's response.
        // The probe goes in before the long-task reset and is read after.

        // Measure: home Swap button to the swap page.
        const swapButton = { css: 'button', text: 'Swap' };
        await driver.findClickableElement(swapButton);
        const loadPageProbe = await startInPageStep(
          driver,
          'bridge_load_page',
          { endSelector: IN_PAGE_DESTINATIONS.swapPage },
        );
        await driver.resetLongTaskMetrics();
        const timestampBeforeLoadPage = new Date();
        await driver.clickElement(swapButton);
        await new SwapPage(driver).checkPageIsLoaded();
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
          longTasksObserved: longTaskData?.observed ?? false,
        });
        if (loadPageProbe) {
          inPageTimers.push(
            ...(await finishInPageStep(driver, 'bridge_load_page')),
          );
        }

        // Measure: source asset button to the asset picker's search field.
        // With `BENCHMARK_PAGE_IDLE_BEFORE_STEP=1` the step starts once the
        // swap page has gone idle, outside both timers.
        await driver.findClickableElement(quotePage.sourceAssetPickerButton);
        await waitForPageIdleBeforeStep(driver);
        const assetPickerProbe = await startInPageStep(
          driver,
          'bridge_load_asset_picker',
          { endSelector: IN_PAGE_DESTINATIONS.bridgeAssetPicker },
        );
        await driver.resetLongTaskMetrics();
        const timestampBeforeClickAssetPicker = new Date();
        await driver.clickElement(quotePage.sourceAssetPickerButton);
        await driver.waitForSelector(quotePage.assetPrickerSearchInput);
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
          longTasksObserved: longTaskData?.observed ?? false,
        });
        if (assetPickerProbe) {
          inPageTimers.push(
            ...(await finishInPageStep(driver, 'bridge_load_asset_picker')),
          );
        }

        // Measure: typing the search to the matching row. The field is
        // cleared, if it holds anything, before the timer starts, rather than
        // by `driver.fill` inside it, which also waits 200 ms. The result row
        // is matched by the address in its asset id, since a CSS selector
        // cannot match the symbol text the step timer waits on.
        const tokenToSearch = 'FXS';
        const searchInput = await driver.findElement(
          quotePage.assetPrickerSearchInput,
        );
        if ((await searchInput.getAttribute('value')) !== '') {
          await searchInput.sendKeys(
            Key.chord(driver.Key.MODIFIER, 'a', driver.Key.BACK_SPACE),
          );
        }
        const searchProbe =
          FXS_ADDRESS !== undefined &&
          (await startInPageStep(driver, 'bridge_search_token', {
            endSelector: `[data-testid^="bridge-asset--"][data-testid$="${FXS_ADDRESS}" i]`,
            startWithin: quotePage.assetPrickerSearchInput,
            typedOnly: true,
          }));
        await driver.resetLongTaskMetrics();
        const timestampBeforeTokenSearch = new Date();
        await (
          await driver.findElement(quotePage.assetPrickerSearchInput)
        ).sendKeys(tokenToSearch);
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
          longTasksObserved: longTaskData?.observed ?? false,
        });
        if (searchProbe) {
          inPageTimers.push(
            ...(await finishInPageStep(driver, 'bridge_search_token')),
          );
        }

        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
      },
    );

    return {
      timers: [
        ...steps.map((s) => ({
          id: legacyStepTimerId(s.id),
          value: s.duration,
        })),
        ...buildLongTaskTimerResults(steps),
        ...inPageTimers,
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
