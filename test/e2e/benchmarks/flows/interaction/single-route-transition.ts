/**
 * Benchmark: Single route transitions (cascade-fix profiling)
 *
 * Measures individual Home -> X -> Home round-trips using client-side
 * React Router navigation (not full page reloads). Each transition is
 * isolated to avoid the compounding artifact seen in the rapid
 * route-cycling benchmark.
 *
 * Also collects React Profiler render metrics from
 * window.__REACT_RENDER_METRICS__ to pair timer data with render counts.
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import SwapPage from '../../../page-objects/pages/swap/swap-page';
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

type ProfilerEntry = {
  id: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
};

export const testTitle = 'benchmark-single-route-transition-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

const APP_HEADER_LOGO = '[data-testid="app-header-logo"]';

async function collectProfilerMetrics(
  driver: Driver,
): Promise<ProfilerEntry[]> {
  const metrics = await driver.executeScript(
    'return window.__REACT_RENDER_METRICS__ || []',
  );
  return metrics as ProfilerEntry[];
}

async function resetProfilerMetrics(driver: Driver): Promise<void> {
  await driver.executeScript('window.__REACT_RENDER_METRICS__ = []');
}

async function waitForHome(driver: Driver): Promise<void> {
  const assetListPage = new AssetListPage(driver);
  await assetListPage.checkTokenListIsDisplayed();
}

export async function runSingleRouteTransitionBenchmark(): Promise<BenchmarkRunResult> {
  try {
    const profilerSnapshots: Record<string, ProfilerEntry[]> = {};

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
        await loginWithoutBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);
        const assetListPage = new AssetListPage(driver);
        const homePage = new HomePage(driver);

        await assetListPage.checkTokenListIsDisplayed();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkNumberOfAvailableAccounts(
          WITH_STATE_POWER_USER.withAccounts,
        );
        await accountListPage.closeMultichainAccountsPage();
        await assetListPage.checkTokenListIsDisplayed();

        // Switch to Ethereum Mainnet for asset details
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Ethereum');
        await assetListPage.checkTokenListIsDisplayed();

        // --- Round-trip 1: Home -> Send -> Home ---
        const timerHomeToSend = new TimerHelper('homeToSend');
        const timerSendToHome = new TimerHelper('sendToHome');

        await resetProfilerMetrics(driver);
        await homePage.startSendFlow();
        await timerHomeToSend.measure(async () => {
          const sendPage = new SendPage(driver);
          await sendPage.checkNetworkFilterToggleIsDisplayed();
        });
        performanceTracker.addTimer(timerHomeToSend);
        profilerSnapshots.homeToSend = await collectProfilerMetrics(driver);

        await resetProfilerMetrics(driver);
        await driver.clickElement(APP_HEADER_LOGO);
        await timerSendToHome.measure(async () => {
          await waitForHome(driver);
        });
        performanceTracker.addTimer(timerSendToHome);
        profilerSnapshots.sendToHome = await collectProfilerMetrics(driver);

        // --- Round-trip 2: Home -> Asset Details -> Home ---
        const timerHomeToAssetDetails = new TimerHelper('homeToAssetDetails');
        const timerAssetDetailsToHome = new TimerHelper('assetDetailsToHome');

        await resetProfilerMetrics(driver);
        await assetListPage.clickOnAsset('Ethereum');
        await timerHomeToAssetDetails.measure(async () => {
          await assetListPage.checkPriceChartIsShown();
        });
        performanceTracker.addTimer(timerHomeToAssetDetails);
        profilerSnapshots.homeToAssetDetails =
          await collectProfilerMetrics(driver);

        await resetProfilerMetrics(driver);
        await driver.clickElement(APP_HEADER_LOGO);
        await timerAssetDetailsToHome.measure(async () => {
          await waitForHome(driver);
        });
        performanceTracker.addTimer(timerAssetDetailsToHome);
        profilerSnapshots.assetDetailsToHome =
          await collectProfilerMetrics(driver);

        // --- Round-trip 3: Home -> Swap -> Home ---
        const timerHomeToSwap = new TimerHelper('homeToSwap');
        const timerSwapToHome = new TimerHelper('swapToHome');

        await resetProfilerMetrics(driver);
        await homePage.startSwapFlow();
        await timerHomeToSwap.measure(async () => {
          const swapPage = new SwapPage(driver);
          await swapPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerHomeToSwap);
        profilerSnapshots.homeToSwap = await collectProfilerMetrics(driver);

        await resetProfilerMetrics(driver);
        await driver.clickElement(APP_HEADER_LOGO);
        await timerSwapToHome.measure(async () => {
          await waitForHome(driver);
        });
        performanceTracker.addTimer(timerSwapToHome);
        profilerSnapshots.swapToHome = await collectProfilerMetrics(driver);

        // Log profiler summary for each transition
        for (const [transition, entries] of Object.entries(
          profilerSnapshots,
        )) {
          const totalActual = entries.reduce(
            (sum, e) => sum + e.actualDuration,
            0,
          );
          console.log(
            `[Profiler] ${transition}: ${entries.length} renders, ${totalActual.toFixed(1)}ms actualDuration total`,
          );
        }
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

export const run = runSingleRouteTransitionBenchmark;
