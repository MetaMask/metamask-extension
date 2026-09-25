/**
 * Benchmark: Onboarding - Import existing wallet
 * Measures time for importing an existing wallet during onboarding
 */

import { Browser } from 'selenium-webdriver';
import { Mockttp, MockedEndpoint } from 'mockttp';
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
import {
  sentryCountResult,
  sentryTimerResult,
  waitForSentryTransactions,
} from '../../utils/sentry-transactions';
import { TraceName } from '../../../../../shared/lib/trace';
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
import type {
  BenchmarkRunResult,
  LongTaskStepResult,
  TimerResult,
} from '../../utils/types';

export const testTitle = 'benchmark-onboarding-import-wallet';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runOnboardingImportWalletBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  const traceTimers: TimerResult[] = [];
  let webVitals: WebVitalsMetrics | undefined;
  try {
    await withFixtures(
      {
        title: testTitle,
        manifestFlags: {
          testing: {
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
          // Sample every trace, so the spans this benchmark reads reach the
          // mocked Sentry endpoint. CI builds otherwise send only a small
          // fraction of traces.
          sentry: { tracesSampleRate: 1 },
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
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
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

        // Measure: Import wallet button to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.importWallet(false);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'importWalletToSocialScreen',
            async () => {
              await startOnboardingPage.checkUserSrpButtonIsVisible();
            },
          ),
        );

        // Measure: SRP button to form
        await startOnboardingPage.clickImportWithSrpButton();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'srpButtonToSrpForm',
            async () => {
              const onboardingSrpPage = new OnboardingSrpPage(driver);
              await onboardingSrpPage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Confirm to Password form
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.fillSrp(srp);
        await onboardingSrpPage.clickConfirmButton();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'confirmSrpToPwForm',
            async () => {
              const onboardingPasswordPage = new OnboardingPasswordPage(driver);
              await onboardingPasswordPage.checkPageIsLoaded();
            },
          ),
        );

        // Create password
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        // Measure: Password to Metrics (Chrome only)
        if (isFirefox) {
          await skipPasskeySetup(driver);
        } else {
          steps.push(
            await measureStepWithLongTasks(
              driver,
              'pwFormToMetricsScreen',
              async () => {
                await skipPasskeySetup(driver);
                const onboardingMetricsPage = new OnboardingMetricsPage(driver);
                await onboardingMetricsPage.checkPageIsLoaded();
              },
            ),
          );
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Measure: Metrics to Complete
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'metricsToWalletReadyScreen',
            async () => {
              const onboardingCompletePage = new OnboardingCompletePage(driver);
              await onboardingCompletePage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Done to Home
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
        await headerNavbar.openAccountMenu();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'openAccountMenuToAccountListLoaded',
            async () => {
              const accountListPage = new AccountListPage(driver);
              await accountListPage.checkPageIsLoaded(120000);
            },
          ),
        );

        // The app's own spans over opening the account list, as the Sentry SDK
        // sent them, timed on the browser's clock rather than on the harness's
        // (extension#46006 ([P0] Benchmark step timers measure the test
        // harness, not the browser)).
        //
        // Two spans cover this one interaction, and both are reported because
        // the gap between them is the only thing that localizes where the cost
        // sits. Both start on the element `openAccountMenu` clicks: `Account
        // List` in the account picker's own `onClick`, and `Show Account List`
        // in the handler that `onClick` then calls. Both end on a mount effect
        // in `MultichainAccountList`. So each covers the click and the first
        // wait that `openAccountMenu` consumes before the step above starts
        // measuring, which the step timer cannot see.
        //
        // These are the only spans this flow converts. The six earlier steps
        // have no span whose interval matches them; the commit message records
        // the per-step finding. Report-only: no threshold is registered, and
        // both carry a `unit` so `runner.ts` keeps them out of the per-run
        // `total`.
        const transactions = await waitForSentryTransactions(
          driver,
          mockedEndpoint,
          [TraceName.AccountList, TraceName.ShowAccountList],
        );
        traceTimers.push(
          sentryTimerResult(transactions, TraceName.AccountList, 'accountList'),
          sentryTimerResult(
            transactions,
            TraceName.ShowAccountList,
            'showAccountList',
          ),
          sentryCountResult(
            transactions,
            TraceName.ShowAccountList,
            'showAccountListCount',
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
      timers: [
        ...collectTimerResults(),
        ...buildLongTaskTimerResults(steps),
        ...traceTimers,
      ],
      webVitals,
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: [
        ...collectTimerResults(),
        ...buildLongTaskTimerResults(steps),
        ...traceTimers,
      ],
      webVitals,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runOnboardingImportWalletBenchmark;
