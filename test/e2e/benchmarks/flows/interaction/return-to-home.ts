/**
 * Benchmark: Return-to-Home After Navigation
 * Navigates away from Home (Send, Settings, Asset Details) and returns,
 * measuring how fast the Home route re-renders on return.
 * On baseline, dead What's New modal code (#39314) triggers a Home re-render
 * cascade on every return. With the fix, the cascade is eliminated.
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

export const testTitle = 'benchmark-return-to-home';
export const persona = BENCHMARK_PERSONA.POWER_USER;

async function runReturnToHomeBenchmark(): Promise<BenchmarkRunResult> {
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
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await driver.delay(1000);

        // Round 1: Send → Home
        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.checkNetworkFilterToggleIsDisplayed();
        await driver.delay(500);

        const timerFromSend = new TimerHelper('returnHomeFromSend');
        await timerFromSend.measure(async () => {
          await driver.pressActionKey('Escape');
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerFromSend);
        await driver.delay(500);

        // Round 2: Settings → Home
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await driver.delay(500);

        const timerFromSettings = new TimerHelper('returnHomeFromSettings');
        await timerFromSettings.measure(async () => {
          await settingsPage.exitSettings();
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerFromSettings);
        await driver.delay(500);

        // Round 3: Asset Details → Home
        await assetListPage.clickOnAsset('Ethereum');
        await driver.waitForSelector(
          '[data-testid="asset-options__button"]',
        );
        await driver.delay(500);

        const timerFromAssetDetails = new TimerHelper(
          'returnHomeFromAssetDetails',
        );
        await timerFromAssetDetails.measure(async () => {
          await driver.navigate();
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerFromAssetDetails);
        await driver.delay(500);

        // Round 4: Swap → Home
        await homePage.startSwapFlow();
        await driver.waitForSelector(
          '[data-testid="prepare-bridge-page"]',
        );
        await driver.delay(500);

        const timerFromSwap = new TimerHelper('returnHomeFromSwap');
        await timerFromSwap.measure(async () => {
          await driver.navigate();
          await assetListPage.checkTokenListIsDisplayed();
        });
        performanceTracker.addTimer(timerFromSwap);

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

export const run = runReturnToHomeBenchmark;
