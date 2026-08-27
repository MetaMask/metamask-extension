import { withFixtures } from '../../../../helpers';
import { login } from '../../../../page-objects/flows/login.flow';
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

export const testTitle = 'benchmark-scratch-7550-token-search-power-user';
export const persona = BENCHMARK_PERSONA.POWER_USER;

// Generated power-user tokens use symbols TK{n}; this filters a large list.
const TOKEN_SEARCH_QUERY = 'TK';
const TOKEN_OPTIONS_BUTTON =
  '[data-testid="asset-list-control-bar-action-button"]';
const MANAGE_TOKENS_BUTTON = '[data-testid="manageTokens__button"]';
const TOKEN_MANAGEMENT_PAGE = '[data-testid="token-management-page"]';
const TOKEN_MANAGEMENT_SEARCH_INPUT =
  '[data-testid="token-management-search-input"]';
const TOKEN_MANAGEMENT_SEARCH_LOADING =
  '[data-testid="token-management-search-loading"]';
const TOKEN_MANAGEMENT_PAGE_LIST =
  '[data-testid="token-management-page-list"]';

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    const steps: LongTaskStepResult[] = [];
    let webVitals;

    await withFixtures(
      {
        fixtures: await buildPowerUserFixture({ manyTokens: true }),
        testSpecificMock: setupPowerUserBenchmarkMocks,
        title: testTitle,
        ...powerUserManifestFlags,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        await driver.clickElement(TOKEN_OPTIONS_BUTTON);
        await driver.clickElement(MANAGE_TOKENS_BUTTON);
        await driver.waitForSelector(TOKEN_MANAGEMENT_PAGE);

        await driver.resetLongTaskMetrics();
        const startedAt = Date.now();
        await driver.pasteIntoField(
          TOKEN_MANAGEMENT_SEARCH_INPUT,
          TOKEN_SEARCH_QUERY,
        );
        await driver.waitUntil(
          async () => {
            const value = await driver.executeScript(
              `return document.querySelector('[data-testid="token-management-search-input"]')?.value ?? ''`,
            );
            if (value !== TOKEN_SEARCH_QUERY) {
              return false;
            }
            const loading = await driver.isElementPresentAndVisible(
              TOKEN_MANAGEMENT_SEARCH_LOADING,
              200,
            );
            return !loading;
          },
          { timeout: 120_000 },
        );
        await driver.waitForSelector(TOKEN_MANAGEMENT_PAGE_LIST);
        const duration = Date.now() - startedAt;

        const longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'token_search_power_user',
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
          `Token management search "${TOKEN_SEARCH_QUERY}" completed in ${duration}ms`,
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
