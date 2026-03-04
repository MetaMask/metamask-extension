/**
 * Benchmark: Swap flow performance
 * Measures time for swap flow including quote fetching
 */

import type { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import type { MockedEndpoint } from '../../../mock-e2e';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
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
import { BENCHMARK_PERSONA, WITH_STATE_POWER_USER } from '../../utils';
import { BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';
import { registerSwapInterceptor } from '../../mocks/swap-mocks';

export const testTitle = 'benchmark-swap-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;
const SOLANA_USDC_CONTRACT_ADDRESS =
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export async function runSwapBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  try {
    const branchMock = getTestSpecificMock();

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
        testSpecificMock: async (
          mockServer: Mockttp,
        ): Promise<MockedEndpoint[]> => {
          // In pass-through mode (main/release branches), register
          // interceptors inside the single thenPassThrough handler.
          if (!shouldUseMockedRequests()) {
            registerSwapInterceptor(mockServer);
          }

          // On PR branches, register the full mock suite
          const branchEndpoints = branchMock
            ? await branchMock(mockServer)
            : [];
          return [...branchEndpoints];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        // Login flow
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.waitForTokenToBeDisplayed('Ethereum');

        // Wait for Solana balance to load before starting the swap flow
        if (shouldUseMockedRequests()) {
          await assetListPage.checkTokenAmountIsDisplayed('50 SOL');
        } else {
          await assetListPage.waitForTokenToBeDisplayed('SOL');
        }

        // Measure: Open swap page
        await homePage.startSwapFlow();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'openSwapPageFromHome',
            async () => {
              const swapPage = new SwapPage(driver);
              await swapPage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Fetch quotes
        const swapPage = new SwapPage(driver);
        await swapPage.createSwap({
          amount: 0.01,
          swapTo: 'USDC',
          swapToContractAddress: SOLANA_USDC_CONTRACT_ADDRESS,
          swapFrom: 'SOL',
          network: 'Solana',
        });

        steps.push(
          await measureStepWithLongTasks(
            driver,
            'fetchAndDisplaySwapQuotes',
            async () => {
              await swapPage.checkQuoteIsDisplayed({ timeout: 60000 });
            },
          ),
        );
      },
    );

    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runSwapBenchmark;
