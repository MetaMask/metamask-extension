/**
 * Benchmark: Load New Account
 * Measures time to create and load a new account
 */

import type { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import type { MockedEndpoint } from '../../../mock-e2e';
import { login } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/home/header-navbar';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import { Driver } from '../../../webdriver/driver';
import { buildLongTaskTimerResults } from '../../utils/long-task-helper';
import {
  sentryCountResult,
  sentryTimerResult,
  waitForSentryTransactions,
} from '../../utils/sentry-transactions';
import { getTestSpecificMock } from '../../utils/mock-config';
import { TraceName } from '../../../../../shared/lib/trace';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
} from '../../../../../shared/constants/benchmarks';
import { runUserActionBenchmark, collectWebVitals } from '../../utils';
import type {
  BenchmarkRunResult,
  LongTaskStepResult,
  TimerResult,
} from '../../utils/types';

export const testTitle = 'benchmark-user-actions-load-new-account';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadingTimes: number = 0;
    const steps: LongTaskStepResult[] = [];
    const traceTimers: TimerResult[] = [];
    let webVitals;

    const branchMock = getTestSpecificMock();

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        disableServerMochaToBackground: true,
        localNodeOptions: {
          accounts: 1,
        },
        manifestFlags: {
          // Sample every trace, so the account-creation span reaches the
          // mocked Sentry endpoint this benchmark reads it from. CI builds
          // otherwise send only a small fraction of traces.
          sentry: { tracesSampleRate: 1 },
        },
        testSpecificMock: async (
          mockServer: Mockttp,
        ): Promise<MockedEndpoint[]> => branchMock(mockServer),
        title: testTitle,
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        await driver.resetLongTaskMetrics();
        const timestampBeforeAction = new Date();
        await accountListPage.addMultichainAccount();
        const timestampAfterAction = new Date();
        loadingTimes =
          timestampAfterAction.getTime() - timestampBeforeAction.getTime();

        const longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'load_new_account',
          duration: loadingTimes,
          longTaskCount: longTaskData?.count ?? 0,
          longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
          longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
          tbt: longTaskData?.tbt ?? 0,
        });

        // The app's own span over the same step, as the Sentry SDK sent it,
        // timed on the browser's clock (extension#46006).
        // `addMultichainAccount` clicks `add-multichain-account-button`, whose
        // handler brackets `createNextMultichainAccountGroup` with this trace.
        // Report-only: no threshold is registered for it.
        const transactions = await waitForSentryTransactions(
          driver,
          mockedEndpoint,
          [TraceName.CreateMultichainAccount],
        );
        traceTimers.push(
          sentryTimerResult(
            transactions,
            TraceName.CreateMultichainAccount,
            'createMultichainAccount',
          ),
          sentryCountResult(
            transactions,
            TraceName.CreateMultichainAccount,
            'createMultichainAccountCount',
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
        ...steps.map((s) => ({ id: s.id, value: s.duration })),
        ...buildLongTaskTimerResults(steps),
        ...traceTimers,
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
