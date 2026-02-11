/**
 * Benchmark: Swap flow performance
 * Measures time for swap flow including quote fetching
 */

import { Readable } from 'stream';
import { ReadableStream as ReadableStreamWeb } from 'stream/web';
import type { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import type { MockedEndpoint } from '../../../mock-e2e';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
import { SSE_RESPONSE_HEADER } from '../../../tests/bridge/constants';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import { BENCHMARK_PERSONA, WITH_STATE_POWER_USER } from '../../utils';
import { BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';
import swapQuoteSolUsdc from '../../mocks/swap-quote-sol-usdc.json';

export const testTitle = 'benchmark-swap-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

/**
 * Builds an SSE stream for getQuoteStream with the given quote payloads.
 * This mock is always needed because the real SSE endpoint requires
 * authentication and doesn't work reliably through the test proxy.
 *
 * @param events - Quote payloads to stream
 * @param delayMs - Delay between events
 */
function mockSseQuoteStream(
  events: unknown[],
  delayMs = 500,
): ReturnType<typeof Readable.fromWeb> {
  let index = 0;
  const getEventId = (i: number) => `${Date.now().toString()}-${i}`;
  const emitLine = (
    c: ReadableStreamDefaultController<Uint8Array>,
    line: string,
  ) => c.enqueue(new TextEncoder().encode(line));
  return Readable.fromWeb(
    new ReadableStreamWeb<Uint8Array>({
      async pull(controller) {
        if (index >= events.length) {
          controller.close();
          return;
        }
        const quote = events[index];
        emitLine(controller, `event: quote\n`);
        emitLine(controller, `id: ${getEventId(index + 1)}\n`);
        emitLine(controller, `data: ${JSON.stringify(quote)}\n\n`);
        await new Promise((r) => setTimeout(r, delayMs));
        index += 1;
      },
    }),
  );
}

/**
 * Registers getQuoteStream SSE mocks on the mock server.
 * Mockttp streams are single-use, so we register multiple rules
 * so every getQuoteStream request gets a fresh SSE stream.
 *
 * @param mockServer - The Mockttp server instance
 * @returns Array of mocked endpoints
 */
async function mockGetQuoteStream(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const REPEAT_GET_QUOTE_STREAM = 20;
  const endpoints: MockedEndpoint[] = [];
  for (let i = 0; i < REPEAT_GET_QUOTE_STREAM; i += 1) {
    const mock = await mockServer
      .forGet(/getQuoteStream/u)
      .once()
      .thenStream(
        200,
        mockSseQuoteStream([swapQuoteSolUsdc]),
        SSE_RESPONSE_HEADER,
      );
    endpoints.push(mock);
  }
  return endpoints;
}

export async function runSwapBenchmark(): Promise<BenchmarkRunResult> {
  try {
    // The getQuoteStream SSE mock is always needed (real API requires auth
    // and doesn't work reliably through the test proxy).
    // On PR branches, we also include the full mockPowerUserPrices mocks.
    const branchMock = getTestSpecificMock();

    await withFixtures(
      {
        title: testTitle,
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          remoteFeatureFlags: {
            bridgeConfig: {
              refreshRate: 30000,
              maxRefreshCount: 5,
              support: true,
              sse: {
                enabled: true,
                minimumVersion: '13.2.0',
              },
              chains: {
                '1': { isActiveSrc: true, isActiveDest: true },
                '10': { isActiveSrc: true, isActiveDest: true },
                '137': { isActiveSrc: true, isActiveDest: true },
                '42161': { isActiveSrc: true, isActiveDest: true },
                '8453': { isActiveSrc: true, isActiveDest: true },
                '59144': { isActiveSrc: true, isActiveDest: true },
                '1151111081099710': {
                  isActiveSrc: true,
                  isActiveDest: true,
                },
              },
            },
          },
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: async (
          mockServer: Mockttp,
        ): Promise<MockedEndpoint[]> => {
          // Always register the getQuoteStream SSE mock (essential for swap)
          const quoteStreamEndpoints = await mockGetQuoteStream(mockServer);

          // On PR branches, also register full mock suite
          const branchEndpoints = branchMock
            ? await branchMock(mockServer)
            : [];

          return [...quoteStreamEndpoints, ...branchEndpoints];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const timerOpenSwapPage = new TimerHelper('openSwapPageFromHome');
        const timerQuoteFetching = new TimerHelper('fetchAndDisplaySwapQuotes');

        // Login flow
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.waitForTokenToBeDisplayed('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        // Wait for Solana balance to load before starting the swap flow
        // In mocked mode, balance is 50 SOL; in real server mode skip this wait
        if (shouldUseMockedRequests()) {
          await assetListPage.checkTokenAmountIsDisplayed('50 SOL');
        }

        // Measure: Open swap page
        await homePage.startSwapFlow();
        await timerOpenSwapPage.measure(async () => {
          const swapPage = new SwapPage(driver);
          await swapPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerOpenSwapPage);
        // Measure: Fetch quotes (longer timeout in CI where quote fetching can be slow)
        const swapPage = new SwapPage(driver);
        await swapPage.createSolanaSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'SOL',
        });

        await timerQuoteFetching.measure(async () => {
          await swapPage.checkQuoteIsDisplayed({ timeout: 60000 });
        });
        performanceTracker.addTimer(timerQuoteFetching);
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

export const run = runSwapBenchmark;
