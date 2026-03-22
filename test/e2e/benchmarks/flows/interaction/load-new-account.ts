/**
 * Benchmark: Load New Account
 * Measures time to create and load a new account
 */

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { Driver } from '../../../webdriver/driver';
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';
import { runUserActionBenchmark } from '../../utils/runner';

export const testTitle = 'benchmark-user-actions-load-new-account';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadingTimes: number = 0;
    const fixtures = new FixtureBuilderV2()
      .withAccountTreeController({
        // Keep benchmark timing stable by starting after the first full sync.
        hasAccountTreeSyncingSyncedAtLeastOnce: true,
      })
      .withPreferencesController({
        pendingShieldCohort: null,
      })
      .withNotificationServicesController({
        isFeatureAnnouncementsEnabled: true,
        isMetamaskNotificationsFeatureSeen: true,
        isNotificationServicesEnabled: true,
        subscriptionAccountsSeen: [DEFAULT_FIXTURE_ACCOUNT],
      })
      .build();

    await withFixtures(
      {
        fixtures,
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

        const timestampBeforeAction = new Date();
        await accountListPage.addMultichainAccount();
        const timestampAfterAction = new Date();
        loadingTimes =
          timestampAfterAction.getTime() - timestampBeforeAction.getTime();
      },
    );

    return [{ id: 'load_new_account', duration: loadingTimes }];
  }, BENCHMARK_TYPE.USER_ACTION);
}
