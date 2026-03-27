/**
 * Benchmark: Standard Home Page Load
 * Measures home page load time with standard wallet state
 */

import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import {
  BENCHMARK_PERSONA,
  runPageLoadBenchmark,
  collectWebVitals,
} from '../../utils';
import type {
  BenchmarkResults,
  WebVitalsMetrics,
  Metrics,
  PageLoadBenchmarkOptions,
  MeasurePageResult,
} from '../../utils';

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
      fixtures: new FixtureBuilder().build(),
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

        webVitalsRuns.push(await collectWebVitals(driver));
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
