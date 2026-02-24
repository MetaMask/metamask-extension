/**
 * Benchmark: Rapid Route Cycling
 * Navigates Home → Send → Home → Settings → Home → Asset Details → Home → Swap → Home
 * Each route change triggers `withRouterHooks` prop instability on baseline (#39311).
 * With the fix, memoized params/location prevent cascade re-renders.
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
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
} from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';
import { collectWebVitals } from '../../utils/web-vitals-collector';

export const testTitle = 'benchmark-rapid-route-cycling';
export const persona = BENCHMARK_PERSONA.POWER_USER;

async function runRapidRouteCyclingBenchmark(): Promise<BenchmarkRunResult> {
  try {
    let webVitals;

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
        const timerHomeToSend = new TimerHelper('homeToSend');
        const timerSendToHome = new TimerHelper('sendToHome');
        const timerHomeToSettings = new TimerHelper('homeToSettings');
        const timerSettingsToHome = new TimerHelper('settingsToHome');
        const timerHomeToAssetDetails = new TimerHelper('homeToAssetDetails');
        const timerAssetDetailsToHome = new TimerHelper('assetDetailsToHome');
        const timerHomeToSwap = new TimerHelper('homeToSwap');
        const timerSwapToHome = new TimerHelper('swapToHome');

        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await driver.delay(1000);

        // Transition 1: Home → Send
        await timerHomeToSend.measure(async () => {
          await homePage.startSendFlow();
          const sendPage = new SendPage(driver);
          await sendPage.checkNetworkFilterToggleIsDisplayed();
        });
        performanceTracker.addTimer(timerHomeToSend);

        // Transition 2: Send → Home (press Escape to close send)
        await timerSendToHome.measure(async () => {
          await driver.pressActionKey('Escape');
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerSendToHome);

        // Transition 3: Home → Settings
        await timerHomeToSettings.measure(async () => {
          await headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerHomeToSettings);

        // Transition 4: Settings → Home
        await timerSettingsToHome.measure(async () => {
          const settingsPage = new SettingsPage(driver);
          await settingsPage.exitSettings();
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerSettingsToHome);

        // Transition 5: Home → Asset Details (click ETH)
        await timerHomeToAssetDetails.measure(async () => {
          await assetListPage.clickOnAsset('Ethereum');
          await driver.waitForSelector('[data-testid="asset-options__button"]');
        });
        performanceTracker.addTimer(timerHomeToAssetDetails);

        // Transition 6: Asset Details → Home (browser back)
        await timerAssetDetailsToHome.measure(async () => {
          await driver.navigate();
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerAssetDetailsToHome);

        // Transition 7: Home → Swap
        await timerHomeToSwap.measure(async () => {
          await homePage.startSwapFlow();
          await driver.waitForSelector('[data-testid="prepare-bridge-page"]');
        });
        performanceTracker.addTimer(timerHomeToSwap);

        // Transition 8: Swap → Home (browser back)
        await timerSwapToHome.measure(async () => {
          await driver.navigate();
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerSwapToHome);

        webVitals = await collectWebVitals(driver);
      },
    );

    return {
      timers: collectTimerResults(),
      webVitals,
      success: true,
      benchmarkType: BENCHMARK_TYPE.USER_ACTION,
    };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.USER_ACTION,
    };
  }
}

export const run = runRapidRouteCyclingBenchmark;
