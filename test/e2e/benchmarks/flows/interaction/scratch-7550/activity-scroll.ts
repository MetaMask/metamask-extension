import { withFixtures } from '../../../../helpers';
import { login } from '../../../../page-objects/flows/login.flow';
import ActivityTab from '../../../../page-objects/pages/home/activity-tab';
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

export const testTitle = 'benchmark-scratch-7550-activity-scroll';
export const persona = BENCHMARK_PERSONA.POWER_USER;

const SCROLL_ITERATIONS = 8;

async function scrollActivityList(driver: Driver): Promise<void> {
  await driver.executeScript(`
    const items = document.querySelectorAll('[data-testid="activity-list-item"]');
    if (items.length > 0) {
      items[items.length - 1].scrollIntoView({ block: 'end' });
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

        const activityTab = new ActivityTab(driver);
        await activityTab.goToActivityList();
        await driver.waitForSelector('[data-testid="activity-list-item"]');

        await driver.resetLongTaskMetrics();
        const startedAt = Date.now();
        for (let i = 0; i < SCROLL_ITERATIONS; i += 1) {
          await scrollActivityList(driver);
        }
        const duration = Date.now() - startedAt;

        const longTaskData = await driver.collectLongTaskMetrics();
        steps.push({
          id: 'activity_list_scroll',
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
          `Activity list scroll (${SCROLL_ITERATIONS} passes) completed in ${duration}ms`,
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
