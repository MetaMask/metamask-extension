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
import TimerHelper from '../../utils/TimerHelper';
import Timers from '../../utils/Timers';
import { collectTimerResults } from '../../utils/timer-utils';
import type { BenchmarkRunResult } from '../../utils/types';

async function getCommonMocks(server: Mockttp) {
  return [
    await server
      .forGet(/^https:\/\/proxy\.metafi\.codefi\.network\/price\/.*/)
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}

export const testTitle = 'benchmark-onboarding-import-wallet';
export const persona = 'standard';

export async function runOnboardingImportWalletBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

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
          return [...(await getCommonMocks(server))];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const srp = process.env.E2E_POWER_USER_SRP || E2E_SRP;

        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        // Timer: Import wallet button to Social screen
        const timerImportWalletToSocial = new TimerHelper(
          'importWalletToSocialScreen',
          2000,
        );
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.importWallet(false);
        await timerImportWalletToSocial.measure(async () => {
          await startOnboardingPage.checkUserSrpButtonIsVisible();
        });

        // Timer: SRP button to form
        const timerSrpButtonToForm = new TimerHelper(
          'srpButtonToSrpForm',
          2000,
        );
        await startOnboardingPage.clickImportWithSrpButton();
        await timerSrpButtonToForm.measure(async () => {
          const onboardingSrpPage = new OnboardingSrpPage(driver);
          await onboardingSrpPage.checkPageIsLoaded();
        });

        // Timer: Confirm to Password form
        const timerConfirmToPassword = new TimerHelper(
          'confirmSrpToPasswordForm',
          3000,
        );
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.fillSrp(srp);
        await onboardingSrpPage.clickConfirmButton();
        await timerConfirmToPassword.measure(async () => {
          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
        });

        // Create password
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        // Timer: Password to Metrics (Chrome only)
        if (!isFirefox) {
          const timerPasswordToMetrics = new TimerHelper(
            'passwordFormToMetricsScreen',
            3000,
          );
          await timerPasswordToMetrics.measure(async () => {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
          });
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Timer: Metrics to Complete
        const timerMetricsToComplete = new TimerHelper(
          'metricsToWalletReadyScreen',
          3000,
        );
        await timerMetricsToComplete.measure(async () => {
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
        });

        // Timer: Done to Home
        const timerDoneToHome = new TimerHelper(
          'doneButtonToHomeScreen',
          15000,
        );
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        await timerDoneToHome.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkConversionRateDisplayed();
          await assetListPage.checkTokenExistsInList('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });

        // Timer: Account list load
        const timerAccountListLoad = new TimerHelper(
          'openAccountMenuToAccountListLoaded',
          5000,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerAccountListLoad.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded(30000);
        });
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
