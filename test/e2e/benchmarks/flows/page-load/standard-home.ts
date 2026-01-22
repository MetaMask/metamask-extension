/**
 * Benchmark: Standard Home Page Load
 * Measures home page load time with standard wallet state
 */

import { capitalize } from 'lodash';
import get from 'lodash/get';
import { retry } from '../../../../../development/lib/retry';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import type { BenchmarkResults, Metrics } from '../../utils/types';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
} from '../../utils/constants';
import {
  calcMaxResult,
  calcMeanResult,
  calcMinResult,
  calcPResult,
  calcStdDevResult,
} from '../../utils/statistics';

async function measurePageStandard(
  pageName: string,
  pageLoads: number,
): Promise<{ metrics: Metrics[]; title: string; persona: string }> {
  const metrics: Metrics[] = [];
  const title = 'measurePageStandard';
  const persona = 'standard';
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

export async function run(options: {
  browserLoads?: number;
  pageLoads?: number;
  retries?: number;
}): Promise<Record<string, BenchmarkResults>> {
  const {
    browserLoads = DEFAULT_NUM_BROWSER_LOADS,
    pageLoads = DEFAULT_NUM_PAGE_LOADS,
    retries = 0,
  } = options;

  const results: Record<string, BenchmarkResults> = {};
  const pageName = 'home';
  let runResults: Metrics[] = [];
  let testTitle = '';
  let resultPersona = '';

  for (let i = 0; i < browserLoads; i += 1) {
    console.log('Starting browser load', i + 1, 'of', browserLoads);
    const { metrics, title, persona } = await retry({ retries }, () =>
      measurePageStandard(pageName, pageLoads),
    );
    runResults = runResults.concat(metrics);
    testTitle = title;
    resultPersona = persona;
  }

  if (runResults.some((result) => result.navigation.length > 1)) {
    throw new Error(`Multiple navigations not supported`);
  }

  const result: Record<string, number[]> = {};
  for (const [key, tracePath] of Object.entries(ALL_METRICS)) {
    result[key] = runResults
      .map((m) => get(m, tracePath) as number)
      .sort((a, b) => a - b);
  }

  const reportingPageName = `${resultPersona}${capitalize(pageName)}`;
  results[reportingPageName] = {
    testTitle,
    persona: resultPersona,
    mean: calcMeanResult(result),
    min: calcMinResult(result),
    max: calcMaxResult(result),
    stdDev: calcStdDevResult(result),
    p75: calcPResult(result, 75),
    p95: calcPResult(result, 95),
  };

  return results;
}
