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
const TARGET_ACCOUNT_CELL_TEST_ID = `multichain-account-cell-name-${TARGET_ACCOUNT}`;
const ACCOUNT_MENU_ICON = '[data-testid="account-menu-icon"]';
const ACCOUNT_LIST_PAGE = '[data-testid="parent-selector-account-list-page"]';
const POWER_USER_SYNC_TIMEOUT_MS = 120_000;
const HEADER_LABEL_TIMEOUT_MS = 120_000;

async function scrollToAccountCell(
  driver: Driver,
  accountCellTestId: string,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      const found = await driver.executeScript(`
        const testId = ${JSON.stringify(accountCellTestId)};
        const cell = document.querySelector('[data-testid="' + testId + '"]');
        if (cell) {
          cell.scrollIntoView({ block: 'center' });
          return true;
        }
        const scroller =
          document.querySelector(${JSON.stringify(ACCOUNT_LIST_PAGE)}) ||
          document.querySelector('.multichain-account-menu-popover');
        if (scroller) {
          scroller.scrollTop += 400;
        }
        return false;
      `);
      return Boolean(found);
    },
    { timeout: POWER_USER_SYNC_TIMEOUT_MS },
  );
  await driver.delay(150);
}

async function waitForHeaderAccountLabel(
  driver: Driver,
  accountLabel: string,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      const text = await driver.executeScript(
        `return document.querySelector(${JSON.stringify(ACCOUNT_MENU_ICON)})?.textContent ?? ''`,
      );
      if (typeof text !== 'string') {
        return false;
      }
      const normalized = text.replace(/\s+/gu, '');
      const expected = accountLabel.replace(/\s+/gu, '');
      return text.includes(accountLabel) || normalized.includes(expected);
    },
    { timeout: HEADER_LABEL_TIMEOUT_MS },
  );
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
        const accountListPage = new AccountListPage(driver);
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.waitUntilSyncingIsCompleted(
          POWER_USER_SYNC_TIMEOUT_MS,
        );
        await scrollToAccountCell(driver, TARGET_ACCOUNT_CELL_TEST_ID);

        await driver.resetLongTaskMetrics();
        const startedAt = Date.now();
        await driver.clickElement(
          `[data-testid="${TARGET_ACCOUNT_CELL_TEST_ID}"]`,
        );
        await driver
          .waitForSelector(ACCOUNT_LIST_PAGE, {
            state: 'detached',
            timeout: POWER_USER_SYNC_TIMEOUT_MS,
          })
          .catch(() => {
            // Popover may unmount without removing the page root; header label is authoritative.
          });
        await waitForHeaderAccountLabel(driver, TARGET_ACCOUNT);
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
