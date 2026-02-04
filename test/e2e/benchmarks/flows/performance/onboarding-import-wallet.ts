/**
 * Benchmark: Onboarding - Import existing wallet
 * Measures time for importing an existing wallet during onboarding
 */

import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { E2E_SRP } from '../../../fixtures/default-fixture';
import { WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import { Driver } from '../../../webdriver/driver';
import { performanceTracker } from '../../utils/performance-tracker';
import TimerHelper, { collectTimerResults } from '../../utils/timer-helper';
import { getCommonMocks } from '../../utils/common-mocks';
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-onboarding-import-wallet';
export const persona = 'standard';

export async function runOnboardingImportWalletBenchmark(): Promise<BenchmarkRunResult> {
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
        const srp = process.env.E2E_POWER_USER_SRP || E2E_SRP;

        const timerImportWalletToSocial = new TimerHelper(
          'importWalletToSocialScreen',
        );
        const timerSrpButtonToForm = new TimerHelper('srpButtonToSrpForm');
        const timerConfirmToPassword = new TimerHelper(
          'confirmSrpToPasswordForm',
        );
        const timerPasswordToMetrics = new TimerHelper(
          'passwordFormToMetricsScreen',
        );
        const timerMetricsToComplete = new TimerHelper(
          'metricsToWalletReadyScreen',
        );
        const timerDoneToHome = new TimerHelper('doneButtonToHomeScreen');
        const timerAccountListLoad = new TimerHelper(
          'openAccountMenuToAccountListLoaded',
        );

        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        // Measure: Import wallet button to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.importWallet(false);
        await timerImportWalletToSocial.measure(async () => {
          await startOnboardingPage.checkUserSrpButtonIsVisible();
        });
        performanceTracker.addTimer(timerImportWalletToSocial);

        // Measure: SRP button to form
        await startOnboardingPage.clickImportWithSrpButton();
        await timerSrpButtonToForm.measure(async () => {
          const onboardingSrpPage = new OnboardingSrpPage(driver);
          await onboardingSrpPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerSrpButtonToForm);

        // Measure: Confirm to Password form
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.fillSrp(srp);
        await onboardingSrpPage.clickConfirmButton();
        await timerConfirmToPassword.measure(async () => {
          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerConfirmToPassword);

        // Create password
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        // Measure: Password to Metrics (Chrome only)
        if (!isFirefox) {
          await timerPasswordToMetrics.measure(async () => {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
          });
          performanceTracker.addTimer(timerPasswordToMetrics);
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Measure: Metrics to Complete
        await timerMetricsToComplete.measure(async () => {
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerMetricsToComplete);

        // Measure: Done to Home
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        await timerDoneToHome.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkTokenExistsInList('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
        performanceTracker.addTimer(timerDoneToHome);

        // Measure: Account list load
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerAccountListLoad.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded(50000);
        });
        performanceTracker.addTimer(timerAccountListLoad);
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

export const run = runOnboardingImportWalletBenchmark;
