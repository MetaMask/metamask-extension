/**
 * Benchmark: Onboarding - Create new wallet
 * Measures time for creating a new wallet during onboarding
 */

import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../../page-objects/flows/onboarding.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import { getCommonMocks } from '../../utils/common-mocks';
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-onboarding-new-wallet';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function runOnboardingNewWalletBenchmark(): Promise<BenchmarkRunResult> {
  try {
    await withFixtures(
      {
        title: testTitle,
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        fixtures: new FixtureBuilder({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: async (server: Mockttp) => {
          return [...getCommonMocks(server)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const timerCreateWalletToSocial = new TimerHelper(
          'createWalletToSocialScreen',
        );
        const timerSrpButtonToPassword = new TimerHelper('srpButtonToPwForm');
        const timerPasswordToRecovery = new TimerHelper(
          'createPwToRecoveryScreen',
        );
        const timerSkipToMetrics = new TimerHelper('skipBackupToMetricsScreen');
        const timerAgreeToComplete = new TimerHelper(
          'agreeButtonToOnboardingSuccess',
        );
        const timerDoneToAssetList = new TimerHelper('doneButtonToAssetList');

        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        // Measure: Create wallet to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        await timerCreateWalletToSocial.measure(async () => {
          await startOnboardingPage.checkSocialSignUpFormIsVisible();
        });
        performanceTracker.addTimer(timerCreateWalletToSocial);

        // Measure: SRP button to Password form
        await startOnboardingPage.clickCreateWithSrpButton();
        await timerSrpButtonToPassword.measure(async () => {
          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerSrpButtonToPassword);

        // Measure: Password to Recovery
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        await timerPasswordToRecovery.measure(async () => {
          const secureWalletPage = new SecureWalletPage(driver);
          await secureWalletPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerPasswordToRecovery);

        // Skip recovery backup
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.skipSRPBackup();

        // Measure: Skip to Metrics (Chrome only)
        if (!isFirefox) {
          await timerSkipToMetrics.measure(async () => {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
          });
          performanceTracker.addTimer(timerSkipToMetrics);
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Measure: Agree to Complete
        await timerAgreeToComplete.measure(async () => {
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerAgreeToComplete);

        // Measure: Done to Asset list
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        await timerDoneToAssetList.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.waitForTokenToBeDisplayed('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
        performanceTracker.addTimer(timerDoneToAssetList);
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

export const run = runOnboardingNewWalletBenchmark;
