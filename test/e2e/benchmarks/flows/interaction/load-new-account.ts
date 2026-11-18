/**
 * Benchmark: Load New Account
 * Measures time to create and load a new account
 */

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/home/header-navbar';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import { Driver } from '../../../webdriver/driver';
import {
  buildLongTaskTimerResults,
  legacyStepTimerId,
} from '../../utils/long-task-helper';
import {
  finishInPageStep,
  startInPageStep,
} from '../../utils/in-page-step-timer';
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
    const inPageTimers: TimerResult[] = [];
    let webVitals;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        disableServerMochaToBackground: true,
        localNodeOptions: {
          accounts: 1,
        },
        title: testTitle,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // The step holds the Add account click and the app's response, up to
        // the new account in the list. `addMultichainAccount` would first wait
        // out account syncing and for the button to stay ready; those waits
        // run here, before the timer starts. The new account is `Account 2`,
        // since the fixture holds one.
        await accountListPage.waitUntilSyncingIsCompleted();
        await accountListPage.waitForAddAccountButtonStablyReady(0);
        const addAccountButton =
          '[data-testid="add-multichain-account-button"]';
        const newAccount =
          '[data-testid="multichain-account-cell-name-Account 2"]';
        await driver.findClickableElement(addAccountButton);
        const newAccountProbe = await startInPageStep(
          driver,
          'load_new_account',
          { endSelector: newAccount, startWithin: addAccountButton },
        );
        await driver.resetLongTaskMetrics();
        const timestampBeforeAction = new Date();
        await driver.clickElement(addAccountButton);
        await driver.waitForSelector(newAccount);
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
          longTasksObserved: longTaskData?.observed ?? false,
        });
        if (newAccountProbe) {
          inPageTimers.push(
            ...(await finishInPageStep(driver, 'load_new_account')),
          );
        }

        try {
          // `fcp` is the document's first contentful paint, which is the
          // login page's, not this step's, so this flow does not report it.
          webVitals = {
            ...(await collectWebVitals(driver)),
            fcp: null,
            fcpRating: null,
          };
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }
      },
    );

    return {
      timers: [
        ...steps.map((s) => ({
          id: legacyStepTimerId(s.id),
          value: s.duration,
        })),
        ...buildLongTaskTimerResults(steps),
        ...inPageTimers,
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
