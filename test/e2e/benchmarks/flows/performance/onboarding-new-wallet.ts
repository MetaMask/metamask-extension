/**
 * Benchmark: Create new wallet onboarding flow
 * Measures timing for each step of the new wallet creation process
 */
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import Timers from '../../../../timers/Timers';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../../page-objects/flows/onboarding.flow';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults, getCommonMocks } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

export async function runOnboardingNewWalletBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

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

        // Create all timers upfront
        const timer1 = Timers.createTimer('create_wallet_to_social');
        const timer2 = Timers.createTimer('srp_button_to_password');
        const timer3 = Timers.createTimer('password_to_secure');
        const timer4 = Timers.createTimer('secure_to_metrics');
        const timer5 = Timers.createTimer('metrics_to_complete');
        const timer6 = Timers.createTimer('complete_to_home');

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
        timer1.startTimer();
        await startOnboardingPage.checkSocialSignUpFormIsVisible();
        timer1.stopTimer();

        // Timer 2: Time since user clicks "use SRP" button until "Password" form is visible
        await startOnboardingPage.clickCreateWithSrpButton();
        timer2.startTimer();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timer2.stopTimer();

        // Timer 3: Time since user clicks "Create password" until "Recovery Phrase" screen is visible
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        timer3.startTimer();
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        timer3.stopTimer();

        // Timer 4: Time since user clicks "Skip" until "Metrics" screen is visible (if not Firefox)
        await secureWalletPage.skipSRPBackup();
        if (!isFirefox) {
          timer4.startTimer();
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          timer4.stopTimer();
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Timer 5: Time since user clicks "I agree" until "Onboarding Success" screen is visible
        timer5.startTimer();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timer5.stopTimer();

        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        // Timer 6: Time since user clicks "Done" until home page and assets list are visible
        timer6.startTimer();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.waitForTokenToBeDisplayed('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        timer6.stopTimer();
      },
    );

    return { timers: collectTimerResults(), success: true };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run = runOnboardingNewWalletBenchmark;
