/**
 * Benchmark: Standard Home Page Load
 * Measures home page load time with standard wallet state
 */

import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import type {
  BenchmarkResults,
  Metrics,
  PageLoadBenchmarkOptions,
} from '../../utils/types';
import { BENCHMARK_PERSONA } from '../../utils/constants';
import { runPageLoadBenchmark, type MeasurePageResult } from '../../utils';

async function measurePageStandard(
  pageName: string,
  pageLoads: number,
): Promise<MeasurePageResult> {
  const metrics: Metrics[] = [];
  const title = 'measurePageStandard';
  const persona = BENCHMARK_PERSONA.STANDARD;
  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      disableServerMochaToBackground: true,
      title,
    },
    async ({ driver, getNetworkReport, clearNetworkReport }) => {
      await loginWithoutBalanceValidation(driver);

      for (let i = 0; i < pageLoads; i++) {
        clearNetworkReport();
        await driver.navigate(pageName);
        await driver.delay(1000);

        const metricsThisLoad = await driver.collectMetrics();
        metricsThisLoad.numNetworkReqs = getNetworkReport().numNetworkReqs;
        metrics.push(metricsThisLoad);
      }
    },
  );
  return { metrics, title, persona };
}

export async function run(
  options: PageLoadBenchmarkOptions,
): Promise<BenchmarkResults> {
  return runPageLoadBenchmark(measurePageStandard, options);
}
