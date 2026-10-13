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

        // Measure: Create wallet to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'createWalletToSocialScreen',
            async () => {
              await startOnboardingPage.checkSocialSignUpFormIsVisible();
            },
          ),
        );

        // Measure: SRP button to Password form
        await startOnboardingPage.clickCreateWithSrpButton();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'srpButtonToPwForm',
            async () => {
              const onboardingPasswordPage = new OnboardingPasswordPage(driver);
              await onboardingPasswordPage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Password to Recovery
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'createPwToRecoveryScreen',
            async () => {
              await skipPasskeySetup(driver);
              const secureWalletPage = new SecureWalletPage(driver);
              await secureWalletPage.checkPageIsLoaded();
            },
          ),
        );

        // Skip recovery backup
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.skipSRPBackup();

        // Measure: Skip to Metrics (Chrome only)
        if (!isFirefox) {
          steps.push(
            await measureStepWithLongTasks(
              driver,
              'skipBackupToMetricsScreen',
              async () => {
                const onboardingMetricsPage = new OnboardingMetricsPage(driver);
                await onboardingMetricsPage.checkPageIsLoaded();
              },
            ),
          );
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
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
          ),
        );

        // Measure: Done to Asset list
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
        // Restored 2026-10-07. This was commented out on 2026-06-02 as
        // "temporarily to unblock the release" for
        // `MetaMask/metamask-extension#42792` (onboarding benchmarks show a
        // degradation with Assets Unified State on), and that issue is CLOSED, so the
        // stated reason is discharged.
        //
        // The cost of leaving it was not a missing nice-to-have: `onboardingNewWallet.cls`
        // and `onboardingImportWallet.cls` are both in `GATED_METRIC_VALUES`, so for four
        // months two gated metrics produced no value and the gate reported PASS beside
        // them. That is I2 of the admission gate, and these two legs are what it fires on.
        //
        // If the degradation `extension#42792` named -- the Assets Unified State
        // regression on these two onboarding benchmarks -- still exists, restoring
        // collection is how it becomes visible rather than a reason to keep it hidden.
        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
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
