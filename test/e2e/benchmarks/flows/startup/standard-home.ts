/**
 * Benchmark: Standard Home Page Load
 * Measures home page load time with standard wallet state
 */

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import {
  BENCHMARK_PERSONA,
  type BenchmarkResults,
  type WebVitalsMetrics,
} from '../../../../../shared/constants/benchmarks';
import { runPageLoadBenchmark, collectWebVitals } from '../../utils';
import type {
  Metrics,
  PageLoadBenchmarkOptions,
  MeasurePageResult,
} from '../../utils/types';

async function measurePageStandard(
  pageName: string,
  pageLoads: number,
): Promise<MeasurePageResult> {
  const metrics: Metrics[] = [];
  const webVitalsRuns: WebVitalsMetrics[] = [];
  const title = 'measurePageStandard';
  const persona = BENCHMARK_PERSONA.STANDARD;
  await withFixtures(
    {
      fixtures: new FixtureBuilderV2().build(),
      disableServerMochaToBackground: true,
      title,
    },
    async ({ driver, getNetworkReport, clearNetworkReport }) => {
      await login(driver, { validateBalance: false });

      for (let i = 0; i < pageLoads; i++) {
        clearNetworkReport();
        await driver.navigate(pageName);
        await driver.delay(1000);

        const metricsThisLoad = await driver.collectMetrics();
        metricsThisLoad.numNetworkReqs = getNetworkReport().numNetworkReqs;
        metrics.push(metricsThisLoad);

        try {
          webVitalsRuns.push(await collectWebVitals(driver));
        } catch (error) {
          console.error(`Error collecting web vitals for ${pageName}:`, error);
        }
      }
    },
  );
  return { metrics, title, persona, webVitalsRuns };
}

export async function run(
  options: PageLoadBenchmarkOptions,
): Promise<BenchmarkResults> {
  return runPageLoadBenchmark(measurePageStandard, options);
}
