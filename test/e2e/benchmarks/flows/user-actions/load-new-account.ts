/**
 * Benchmark: Load New Account
 * Measures time to create and load a new account
 */

import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { Driver } from '../../../webdriver/driver';
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-userActions-loadNewAccount';
export const persona = 'standard';

export async function run(): Promise<BenchmarkRunResult> {
  let loadingTimes: number = 0;

  try {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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
      },
    );

    return {
      timers: [{ id: 'load_new_account', duration: loadingTimes }],
      success: true,
    };
  } catch (error) {
    return {
      timers: [{ id: 'load_new_account', duration: loadingTimes }],
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
