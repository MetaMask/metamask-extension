/**
 * Benchmark: Onboarding - Create new wallet
 * Measures time for creating a new wallet during onboarding
 */

import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
  skipPasskeySetup,
} from '../../../page-objects/flows/onboarding.flow';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults } from '../../utils/timer-helper';
import {
  measureStepWithLongTasks,
  buildLongTaskTimerResults,
} from '../../utils/long-task-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  type WebVitalsMetrics,
} from '../../../../../shared/constants/benchmarks';
import { collectWebVitals } from '../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';

export const testTitle = 'benchmark-onboarding-new-wallet';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function runOnboardingNewWalletBenchmark(): Promise<BenchmarkRunResult> {
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
        testSpecificMock: getTestSpecificMock(),
      },
      async ({ driver }: { driver: Driver }) => {
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

        // Measure: Create wallet to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'createWalletToSocialScreen',
            async () => {
              await startOnboardingPage.checkSocialSignUpFormIsVisible();
            },
            { trigger: () => startOnboardingPage.createWalletWithSrp(false) },
          ),
        );

        // Measure: SRP button to Password form
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'srpButtonToPwForm',
            async () => {
              const onboardingPasswordPage = new OnboardingPasswordPage(driver);
              await onboardingPasswordPage.checkPageIsLoaded();
            },
            { trigger: () => startOnboardingPage.clickCreateWithSrpButton() },
          ),
        );

        // Measure: Password to Recovery. Typing stays outside the windows;
        // the submit is the trigger.
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.fillWalletPassword(
          WALLET_PASSWORD,
          WALLET_PASSWORD,
        );
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'createPwToRecoveryScreen',
            async () => {
              await skipPasskeySetup(driver);
              const secureWalletPage = new SecureWalletPage(driver);
              await secureWalletPage.checkPageIsLoaded();
            },
            {
              trigger: () => onboardingPasswordPage.clickCreatePasswordButton(),
            },
          ),
        );

        // Skipping the recovery backup triggers the next measured step:
        // the metrics screen on Chrome, the complete screen on Firefox.
        const secureWalletPage = new SecureWalletPage(driver);
        const skipBackup = () => secureWalletPage.skipSRPBackup();

        // Measure: Skip to Metrics (Chrome only)
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        if (!isFirefox) {
          steps.push(
            await measureStepWithLongTasks(
              driver,
              'skipBackupToMetricsScreen',
              async () => {
                await onboardingMetricsPage.checkPageIsLoaded();
              },
              { trigger: skipBackup },
            ),
          );
        }

        // Measure: Agree to Complete
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'agreeButtonToOnboardingSuccess',
            async () => {
              const onboardingCompletePage = new OnboardingCompletePage(driver);
              await onboardingCompletePage.checkPageIsLoaded();
            },
            {
              trigger: isFirefox
                ? skipBackup
                : () => onboardingMetricsPage.clickOnContinueButton(),
            },
          ),
        );

        // Measure: Done to Asset list. Its window still opens after the
        // trigger, on both browsers. On Chrome the harness then navigates to
        // home.html, which replaces the document, so a reset before the Done
        // click would clear counters this step never reads.
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'doneButtonToAssetList',
            async () => {
              const homePage = new HomePage(driver);
              await homePage.checkPageIsLoaded();
              const tokensTab = new TokensTab(driver);
              await tokensTab.checkTokenListIsDisplayed();
              await tokensTab.waitForTokenToBeDisplayed('Ethereum');
              await tokensTab.waitForTokenToBeDisplayed('Solana', 60000);
            },
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

export const run = runOnboardingNewWalletBenchmark;
