/**
 * Benchmark: Onboarding - Create new wallet
 * Measures time for creating a new wallet during onboarding
 */

/**
 * Why the six steps below still read the harness clock.
 *
 * `extension#46006 ([P0] Benchmark step timers measure the test harness, not
 * the browser)` asks each step to be measured from the app's own trace span, as
 * the swap flow beside this one does. Every step here was checked and none
 * converts, so none was converted: no span starts and ends on the same app
 * events as its step.
 *
 * That is the bar the swap pilot meets. `TraceName.SwapViewLoaded` starts on
 * the navigation click in `useBridgeNavigation.ts` and ends on page-load-ready
 * in `prepare-bridge-page.tsx`, which are exactly the `openSwapPageFromHome`
 * boundaries.
 *
 * Two things bound what a candidate span can be. A `TraceName` member is only a
 * name: `CreateAccount`, `AddAccount` and `ImportSrp` all read like they belong
 * to a new-wallet flow and all three are declared in `shared/lib/trace.ts` with
 * no `trace` or `endTrace` call site anywhere in `app/`, `ui/` or `shared/`.
 * And the benchmark reads Sentry envelopes, whose transaction items carry only
 * the root span's name, so a span started with a `parentContext` is nested in
 * its parent's payload and cannot be read out by name at all.
 *
 * The onboarding spans that are real carry the
 * `TraceOperation.OnboardingUserJourney` op and bracket runs of steps rather
 * than single steps:
 *
 * `createWalletToSocialScreen` - the `onboarding-create-wallet` click only
 * reveals the login options in `welcome-login.tsx`. Neither boundary is
 * instrumented.
 *
 * `srpButtonToPwForm` - `TraceName.OnboardingNewSrpCreateWallet` starts on
 * exactly this click, in `onCreateClick` in `welcome.tsx`, but ends two steps
 * later at the SRP-backup skip, in `handleRemindLater` in
 * `review-recovery-phrase.tsx`. Nothing ends when the password page loads. The
 * step is bracketed by two instrumented events - that span's start and
 * `TraceName.OnboardingPasswordSetupAttempt`'s start - so it is measurable from
 * inside the browser, but not by any single existing span.
 *
 * `createPwToRecoveryScreen` - `TraceName.OnboardingPasswordSetupAttempt`
 * covers the mount and unmount of `create-password.tsx`. It opens at the
 * previous step's end, so it includes the harness typing the password, and it
 * closes on the route change to the passkey screen, before this step's
 * `skipPasskeySetup` runs.
 *
 * `skipBackupToMetricsScreen` - `handleRemindLater` ends two spans on this
 * click and starts none, and nothing ends when the metrics screen loads.
 *
 * `agreeButtonToOnboardingSuccess` - `metametrics.tsx` and the completion
 * screen carry no trace at all.
 *
 * `doneButtonToAssetList` - `handleSidepanelPostOnboarding` navigates to
 * `home.html` and waits for the header before this timer starts, so the whole
 * startup tree has already finished by then: `TraceName.UIStartup` in
 * `app/scripts/ui.ts`, and `TraceName.SetupStore`, `TraceName.InitialActions`
 * and `TraceName.FirstRender`, which `ui/index.js` starts under `UIStartup` as
 * its children and which are therefore not readable as transactions anyway. The
 * only other candidate is `TraceName.AccountOverviewAssetListTab`, which
 * `token-list.tsx` ends here but which `account-overview-tabs.tsx` only ever
 * starts on a tab click, so it is ended without having been started.
 *
 * Two facts gate any future conversion, both from the buffering in
 * `app/scripts/services/sentry/sentry-tracing-service.ts`. Onboarding spans are
 * buffered until the metrics decision, with their `parentContext` stripped. On
 * Chrome the metrics screen is accepted with the participate checkbox at its
 * default, so `trackTracesAfterMetricsOptIn` replays them with their recorded
 * timestamps and each arrives as its own transaction. On Firefox this flow opts
 * out before onboarding starts, so `clearTracesAfterMetricsOptIn` discards
 * every onboarding span and none is ever sent. And that replay happens at
 * `agreeButtonToOnboardingSuccess`, so no onboarding transaction exists before
 * that step whatever the sample rate is.
 *
 * Do not read the existing numbers here as a baseline. The `total` for this
 * flow was a coin flip at a 79% observed failure rate, and `extension#46319
 * (pause startupPowerUserHome and the CUF timing gates)` pauses its gate.
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
