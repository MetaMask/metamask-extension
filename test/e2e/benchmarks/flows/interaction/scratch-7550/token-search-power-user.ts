import { withFixtures } from '../../../../helpers';
import { login } from '../../../../page-objects/flows/login.flow';
import TokensTab from '../../../../page-objects/pages/home/tokens-tab';
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

const TOKEN_SEARCH_QUERY = 'dai';
const TOKEN_MANAGEMENT_SEARCH_INPUT =
  '[data-testid="token-management-search-input"]';

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

        const tokensTab = new TokensTab(driver);
        await tokensTab.clickTokenOptionsButton();
        await tokensTab.clickManageTokens();
        await driver.waitForSelector(TOKEN_MANAGEMENT_SEARCH_INPUT);

        await driver.resetLongTaskMetrics();
        const startedAt = Date.now();
        await driver.pasteIntoField(
          TOKEN_MANAGEMENT_SEARCH_INPUT,
          TOKEN_SEARCH_QUERY,
        );
        await driver.waitForSelector({
          css: TOKEN_MANAGEMENT_SEARCH_INPUT,
          text: TOKEN_SEARCH_QUERY,
        });
        await driver.waitForSelector({
          css: '[data-testid="token-management-page"]',
        });
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
