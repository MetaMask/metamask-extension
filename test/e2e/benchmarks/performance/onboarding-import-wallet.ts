/**
 * Benchmark: Import existing wallet onboarding flow
 * Measures timing for each step of the import wallet process
 */
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../app/scripts/fixtures/with-networks';
import { E2E_SRP } from '../../fixtures/default-fixture';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { WALLET_PASSWORD, withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../page-objects/flows/onboarding.flow';
import { Driver } from '../../webdriver/driver';
import { getCommonMocks } from '../utils/constants';
import type { BenchmarkRunResult, TimerResult } from '../utils/types';

export async function runOnboardingImportWalletBenchmark(): Promise<BenchmarkRunResult> {
  const timers: TimerResult[] = [];

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
        const timer1Start = Date.now();
        await startOnboardingPage.checkUserSrpButtonIsVisible();
        timers.push({
          id: 'import_wallet_to_social_screen',
          duration: Date.now() - timer1Start,
        });

        // Timer 2: Time since user clicks "use SRP" button until "SRP" form is visible
        await startOnboardingPage.clickImportWithSrpButton();
        const timer2Start = Date.now();
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.checkPageIsLoaded();
        timers.push({
          id: 'srp_button_to_form',
          duration: Date.now() - timer2Start,
        });

        await onboardingSrpPage.fillSrp(srp);

        // Timer 3: Time since user clicks "Confirm" until "Password" form is visible
        await onboardingSrpPage.clickConfirmButton();
        const timer3Start = Date.now();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timers.push({
          id: 'srp_confirm_to_password',
          duration: Date.now() - timer3Start,
        });

        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        if (!isFirefox) {
          // Timer 4: Time since password form continues until "Metrics" screen is visible
          const timer4Start = Date.now();
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          timers.push({
            id: 'password_to_metrics',
            duration: Date.now() - timer4Start,
          });
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Timer 5: Time since user clicks "Continue" until "Wallet is ready" screen is visible
        const timer5Start = Date.now();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timers.push({
          id: 'metrics_to_complete',
          duration: Date.now() - timer5Start,
        });

        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);

        // Timer 6: Time since user clicks "Done" until "Home" screen is visible
        const timer6Start = Date.now();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.checkTokenExistsInList('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        timers.push({
          id: 'complete_to_home_with_assets',
          duration: Date.now() - timer6Start,
        });

        // Timer 7: Time since user opens "account list" until the account list is loaded
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const timer7Start = Date.now();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        timers.push({
          id: 'open_account_list',
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
