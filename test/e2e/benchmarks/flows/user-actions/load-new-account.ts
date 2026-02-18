/**
 * Benchmark: Load New Account
 * Measures time to create and load a new account
 */

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { Driver } from '../../../webdriver/driver';
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';
import { runUserActionBenchmark } from '../../utils/runner';
import { collectWebVitals } from '../../utils/web-vitals-collector';

export const testTitle = 'benchmark-user-actions-load-new-account';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadingTimes: number = 0;
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
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        const timestampBeforeAction = new Date();
        await accountListPage.addMultichainAccount();
        const timestampAfterAction = new Date();
        loadingTimes =
          timestampAfterAction.getTime() - timestampBeforeAction.getTime();

        webVitals = await collectWebVitals(driver);
      },
    );

    return {
      timers: [{ id: 'load_new_account', duration: loadingTimes }],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
