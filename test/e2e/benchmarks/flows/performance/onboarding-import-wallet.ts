/**
 * Benchmark: Import existing wallet onboarding flow
 * Measures timing for each step of the import wallet process
 */
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import Timers from '../../../../timers/Timers';
import { E2E_SRP } from '../../../fixtures/default-fixture';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../../page-objects/flows/onboarding.flow';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults, getCommonMocks } from '../../utils';
import type { BenchmarkRunResult } from '../../utils/types';

export async function runOnboardingImportWalletBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

  try {
    await withFixtures(
      {
        title: 'benchmark-onboarding-import-wallet',
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
        const srp = process.env.E2E_POWER_USER_SRP || E2E_SRP;
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

        // Create all timers upfront
        const timer1 = Timers.createTimer('import_wallet_to_social_screen');
        const timer2 = Timers.createTimer('srp_button_to_form');
        const timer3 = Timers.createTimer('srp_confirm_to_password');
        const timer4 = Timers.createTimer('password_to_metrics');
        const timer5 = Timers.createTimer('metrics_to_complete');
        const timer6 = Timers.createTimer('complete_to_home_with_assets');
        const timer7 = Timers.createTimer('open_account_list');

        await driver.navigate();

        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // Timer 1: Time since user clicks "Import wallet" until "Social" screen is visible
        await startOnboardingPage.importWallet(false);
        timer1.startTimer();
        await startOnboardingPage.checkUserSrpButtonIsVisible();
        timer1.stopTimer();

        // Timer 2: Time since user clicks "use SRP" button until "SRP" form is visible
        await startOnboardingPage.clickImportWithSrpButton();
        timer2.startTimer();
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.checkPageIsLoaded();
        timer2.stopTimer();

        await onboardingSrpPage.fillSrp(srp);

        // Timer 3: Time since user clicks "Confirm" until "Password" form is visible
        await onboardingSrpPage.clickConfirmButton();
        timer3.startTimer();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timer3.stopTimer();

        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        if (!isFirefox) {
          // Timer 4: Time since password form continues until "Metrics" screen is visible
          timer4.startTimer();
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          timer4.stopTimer();
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Timer 5: Time since user clicks "Continue" until "Wallet is ready" screen is visible
        timer5.startTimer();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timer5.stopTimer();

        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        // Timer 6: Time since user clicks "Done" until "Home" screen is visible
        timer6.startTimer();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.checkTokenExistsInList('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        timer6.stopTimer();

        // Timer 7: Time since user opens "account list" until the account list is loaded
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        timer7.startTimer();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        timer7.stopTimer();
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
