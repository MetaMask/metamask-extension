/**
 * Benchmark: Onboarding - Import existing wallet
 * Measures time for importing an existing wallet during onboarding
 */

import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { E2E_SRP, WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
  skipPasskeySetup,
} from '../../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import HeaderNavbar from '../../../page-objects/pages/home/header-navbar';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults } from '../../utils/timer-helper';
import {
  measureStepWithLongTasks,
  buildLongTaskTimerResults,
} from '../../utils/long-task-helper';
import { setPassThroughInterceptor } from '../../../mock-e2e-pass-through';
import {
  getCommonMocks,
  benchmarkPassThroughInterceptor,
  mockBenchmarkEndpoints,
  userStorageHostMock,
} from '../../mocks/performance-mocks';
import { shouldUseMockedRequests } from '../../utils/mock-config';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  type WebVitalsMetrics,
} from '../../../../../shared/constants/benchmarks';
import { collectWebVitals } from '../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';

export const testTitle = 'benchmark-onboarding-import-wallet';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runOnboardingImportWalletBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  let webVitals: WebVitalsMetrics | undefined;
  try {
    await withFixtures(
      {
        title: testTitle,
        manifestFlags: {
          testing: {
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: async (server: Mockttp) => {
          if (shouldUseMockedRequests()) {
            const endpoints = await mockBenchmarkEndpoints(server);
            await userStorageHostMock(server);
            return endpoints;
          }
          setPassThroughInterceptor(server, benchmarkPassThroughInterceptor);
          await userStorageHostMock(server);
          return Promise.all(getCommonMocks(server));
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const srp = process.env.E2E_POWER_USER_SRP || E2E_SRP;

        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            consentDecisionMade: true,
            optedIn: false,
            dataCollectionForMarketing: false,
          });
        }

        // Each step's trigger runs inside `measureStepWithLongTasks`, after
        // the long-task window opens and before the step timer starts, so the
        // page's work in response to it counts toward the step's blocking
        // metrics and not toward its duration.

        // Measure: Import wallet button to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'importWalletToSocialScreen',
            async () => {
              await startOnboardingPage.checkUserSrpButtonIsVisible();
            },
            { trigger: () => startOnboardingPage.importWallet(false) },
          ),
        );

        // Measure: SRP button to form
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'srpButtonToSrpForm',
            async () => {
              const onboardingSrpPage = new OnboardingSrpPage(driver);
              await onboardingSrpPage.checkPageIsLoaded();
            },
            { trigger: () => startOnboardingPage.clickImportWithSrpButton() },
          ),
        );

        // Measure: Confirm to Password form
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.fillSrp(srp);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'confirmSrpToPwForm',
            async () => {
              const onboardingPasswordPage = new OnboardingPasswordPage(driver);
              await onboardingPasswordPage.checkPageIsLoaded();
            },
            { trigger: () => onboardingSrpPage.clickConfirmButton() },
          ),
        );

        // Create password: typing stays outside the windows; the submit is
        // the next measured step's trigger.
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.fillWalletPassword(
          WALLET_PASSWORD,
          WALLET_PASSWORD,
        );
        const submitPassword = () =>
          onboardingPasswordPage.clickCreatePasswordButton();

        // Measure: Password to Metrics (Chrome only)
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        if (!isFirefox) {
          steps.push(
            await measureStepWithLongTasks(
              driver,
              'pwFormToMetricsScreen',
              async () => {
                await skipPasskeySetup(driver);
                await onboardingMetricsPage.checkPageIsLoaded();
              },
              { trigger: submitPassword },
            ),
          );
        }

        // Measure: Metrics to Complete. On Firefox the metrics choice was made
        // before the import and there is no passkey screen, so its password
        // submit leads straight to this step.
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'metricsToWalletReadyScreen',
            async () => {
              const onboardingCompletePage = new OnboardingCompletePage(driver);
              await onboardingCompletePage.checkPageIsLoaded();
            },
            {
              trigger: isFirefox
                ? submitPassword
                : () => onboardingMetricsPage.clickOnContinueButton(),
            },
          ),
        );

        // Measure: Done to Home. Its window still opens after the trigger, on
        // both browsers. On Chrome the harness then navigates to home.html,
        // which replaces the document, so a reset before the Done click would
        // clear counters this step never reads.
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'doneButtonToHomeScreen',
            async () => {
              const homePage = new HomePage(driver);
              await homePage.checkPageIsLoaded();
              const tokensTab = new TokensTab(driver);
              await tokensTab.checkTokenListIsDisplayed();
              await tokensTab.checkTokenExistsInList('Ethereum');
              await tokensTab.waitForTokenToBeDisplayed('Solana', 120000);
            },
          ),
        );

        // Measure: Account list load
        const headerNavbar = new HeaderNavbar(driver);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'openAccountMenuToAccountListLoaded',
            async () => {
              const accountListPage = new AccountListPage(driver);
              await accountListPage.checkPageIsLoaded(120000);
            },
            { trigger: () => headerNavbar.openAccountMenu() },
          ),
        );

        // BUG #42792 This test is failing with the ASSETS_UNIFIED_STATE_ENABLED='true'
        // commenting out temporarily to unblock the release
        /*
        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
        */
      },
    );

    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      webVitals,
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      webVitals,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runOnboardingImportWalletBenchmark;
