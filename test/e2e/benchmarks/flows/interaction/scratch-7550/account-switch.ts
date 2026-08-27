import { withFixtures } from '../../../../helpers';
import { login } from '../../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../../page-objects/pages/account-list-page';
import { Driver } from '../../../../webdriver/driver';
import { buildLongTaskTimerResults } from '../../../utils/long-task-helper';
import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
} from '../../../../../../shared/constants/benchmarks';
import { runUserActionBenchmark, collectWebVitals } from '../../../utils';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../../utils/types';
import {
  buildPowerUserFixture,
  powerUserManifestFlags,
  setupPowerUserBenchmarkMocks,
} from '../../../scratch-7550/power-user-fixture';
import { WITH_STATE_POWER_USER } from '../../../utils/constants';

export const testTitle = 'benchmark-scratch-7550-account-switch';
export const persona = BENCHMARK_PERSONA.POWER_USER;

const SOURCE_ACCOUNT = 'Account 1';
const TARGET_ACCOUNT = `Account ${WITH_STATE_POWER_USER.withAccounts}`;

async function scrollAccountListItemIntoView(
  driver: Driver,
  accountLabel: string,
): Promise<void> {
  await driver.executeScript(`
    const label = ${JSON.stringify(accountLabel)};
    const items = document.querySelectorAll(
      '.multichain-account-menu-popover__list--menu-item',
    );
    for (const item of items) {
      if (item.textContent && item.textContent.includes(label)) {
        item.scrollIntoView({ block: 'center' });
        break;
      }
    }
  `);
  await driver.delay(150);
}

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    const steps: LongTaskStepResult[] = [];
    let webVitals;

    await withFixtures(
      {
        fixtures: await buildPowerUserFixture(),
        testSpecificMock: setupPowerUserBenchmarkMocks,
        title: testTitle,
        ...powerUserManifestFlags,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.waitUntilSyncingIsCompleted();
        await accountListPage.checkAccountDisplayedInAccountList(TARGET_ACCOUNT);
        await scrollAccountListItemIntoView(driver, TARGET_ACCOUNT);

        await driver.resetLongTaskMetrics();
        const startedAt = Date.now();
        await accountListPage.switchToAccount(TARGET_ACCOUNT);
        // Menu closes after selection — verify via header label, not list selection.
        await headerNavbar.checkAccountLabel(TARGET_ACCOUNT);
        const duration = Date.now() - startedAt;

        const longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'account_switch',
          duration,
          longTaskCount: longTaskData?.count ?? 0,
          longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
          longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
          tbt: longTaskData?.tbt ?? 0,
        });

        try {
          webVitals = await collectWebVitals(driver);
        } catch (error) {
          console.error('Error collecting web vitals:', error);
        }

        console.log(
          `Account switch ${SOURCE_ACCOUNT} → ${TARGET_ACCOUNT} completed in ${duration}ms`,
        );
      },
    );

    return {
      timers: [
        ...steps.map((step) => ({ id: step.id, value: step.duration })),
        ...buildLongTaskTimerResults(steps),
      ],
      webVitals,
    };
  }, BENCHMARK_TYPE.USER_ACTION);
}
