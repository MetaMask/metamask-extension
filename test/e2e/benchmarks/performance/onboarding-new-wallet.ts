/**
 * Benchmark: Create new wallet onboarding flow
 * Measures timing for each step of the new wallet creation process
 */
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { WALLET_PASSWORD, withFixtures } from '../../helpers';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../page-objects/flows/onboarding.flow';
import { Driver } from '../../webdriver/driver';
import { getCommonMocks } from '../utils/constants';
import type { BenchmarkRunResult, TimerResult } from '../utils/types';

export async function runOnboardingNewWalletBenchmark(): Promise<BenchmarkRunResult> {
  const timers: TimerResult[] = [];

  try {
    await withFixtures(
      {
        title: 'benchmark-onboarding-new-wallet',
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
        testSpecificMock: async (server: Mockttp) => getCommonMocks(server),
      },
      async ({ driver }: { driver: Driver }) => {
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

        await driver.navigate();

        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // Timer 1: Time since user clicks "Create new wallet" until "Social sign up" is visible
        await startOnboardingPage.createWalletWithSrp(false);
        const timer1Start = Date.now();
        await startOnboardingPage.checkSocialSignUpFormIsVisible();
        timers.push({
          id: 'create_wallet_to_social',
          duration: Date.now() - timer1Start,
        });

        // Timer 2: Time since user clicks "use SRP" button until "Password" form is visible
        await startOnboardingPage.clickCreateWithSrpButton();
        const timer2Start = Date.now();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timers.push({
          id: 'srp_button_to_password',
          duration: Date.now() - timer2Start,
        });

        // Timer 3: Time since user clicks "Create password" until "Recovery Phrase" screen is visible
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        const timer3Start = Date.now();
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        timers.push({
          id: 'password_to_secure',
          duration: Date.now() - timer3Start,
        });

        // Timer 4: Time since user clicks "Skip" until "Metrics" screen is visible (if not Firefox)
        await secureWalletPage.skipSRPBackup();
        if (!isFirefox) {
          const timer4Start = Date.now();
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          timers.push({
            id: 'secure_to_metrics',
            duration: Date.now() - timer4Start,
          });
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Timer 5: Time since user clicks "I agree" until "Onboarding Success" screen is visible
        const timer5Start = Date.now();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timers.push({
          id: 'metrics_to_complete',
          duration: Date.now() - timer5Start,
        });

        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        // Timer 6: Time since user clicks "Done" until "Skip backup" screen and assets list are visible
        const timer6Start = Date.now();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        timers.push({
          id: 'complete_to_home',
          duration: Date.now() - timer6Start,
        });

        // Timer 7: Time since user clicks "Skip backup" until "Home" screen is visible
        await homePage.clickBackupRemindMeLaterButton();
        const timer7Start = Date.now();
        await homePage.checkPageIsLoaded();
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.waitForTokenToBeDisplayed('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        timers.push({
          id: 'skip_backup_to_full_home',
          duration: Date.now() - timer7Start,
        });
      },
    );

    return { timers, success: true };
  } catch (error) {
    return {
      timers,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
