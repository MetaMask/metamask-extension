/**
 * Benchmark: Import SRP from home interface
 * Measures time to import an existing wallet from the home page
 */

import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import { withFixtures } from '../../../helpers';
import type { MockedEndpoint } from '../../../mock-e2e';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import HeaderNavbar from '../../../page-objects/pages/home/header-navbar';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/onboarding/login-page';
import { Driver } from '../../../webdriver/driver';
import { collectTimerResults } from '../../utils/timer-helper';
import {
  sentryTimerResult,
  waitForSentryTransactions,
} from '../../utils/sentry-transactions';
import { TraceName } from '../../../../../shared/lib/trace';
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
import { WITH_STATE_POWER_USER } from '../../utils/constants';
import { collectWebVitals } from '../../utils';
import type {
  BenchmarkRunResult,
  LongTaskStepResult,
  TimerResult,
} from '../../utils/types';

const SECOND_SRP = process.env.TEST_SRP_2;

export const testTitle = 'benchmark-import-srp-home-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

export async function runImportSrpHomeBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
  const traceTimers: TimerResult[] = [];
  let webVitals: WebVitalsMetrics | undefined;
  try {
    // Validate required environment variable
    if (!SECOND_SRP) {
      throw new Error(
        'TEST_SRP_2 environment variable is required for import-srp-home benchmark. ' +
          'Please set TEST_SRP_2 with a valid 12-word seed phrase.',
      );
    }
    await withFixtures(
      {
        title: testTitle,
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          testing: {
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
          // Sample every trace, so the account-list span reaches the mocked
          // Sentry endpoint this benchmark reads it from. CI builds otherwise
          // send only a small fraction of traces.
          sentry: { tracesSampleRate: 1 },
        },
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        testSpecificMock: getTestSpecificMock(),
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        // Measure: Login flow (includes triggering action)
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'loginToHomeScreen',
            async () => {
              await loginPage.loginToHomepage();
              const homePage = new HomePage(driver);
              await homePage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Open account menu
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'openAccountMenuAfterLogin',
            async () => {
              const accountListPage = new AccountListPage(driver);
              await accountListPage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Import SRP and return to home
        const accountListPage = new AccountListPage(driver);
        await accountListPage.startImportSecretPhrase(SECOND_SRP);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'homeAfterImportWithNewWallet',
            async () => {
              const homePage = new HomePage(driver);
              await homePage.checkPageIsLoaded();
              const tokensTab = new TokensTab(driver);
              await tokensTab.checkTokenListIsDisplayed();
              await tokensTab.checkTokenExistsInList('Ethereum');
              await tokensTab.waitForTokenToBeDisplayed('Solana', 60000);
            },
          ),
        );

        // The app's own span over the account-menu step, as the Sentry SDK sent
        // it, timed on the browser's clock (extension#46006). `Show Account
        // List` starts on the header account-picker click and ends once the
        // account list has rendered, so it brackets the same operation the
        // `openAccountMenuAfterLogin` step waits on. Report-only: no threshold
        // is registered for it.
        //
        // The other two steps keep harness-clock timers only. No `TraceName`
        // covers unlocking an already-onboarded wallet through to the home
        // screen, and none covers importing an SRP through to the home screen:
        // `TraceName.ImportSrp` has no call site in the app.
        const transactions = await waitForSentryTransactions(
          driver,
          mockedEndpoint,
          [TraceName.ShowAccountList],
        );
        traceTimers.push(
          sentryTimerResult(
            transactions,
            TraceName.ShowAccountList,
            'showAccountList',
          ),
        );

        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
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

export const run = runImportSrpHomeBenchmark;
