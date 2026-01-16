/**
 * Benchmark: Standard Home Page Load
 * Measures home page load time with standard wallet state
 */

import { capitalize } from 'lodash';
import get from 'lodash/get';
import { retry } from '../../../../../development/lib/retry';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { unlockWallet, withFixtures } from '../../../helpers';
import type { BenchmarkResults, Metrics, StatisticalResult } from '../../utils/types';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
} from '../../utils/constants';

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
      await unlockWallet(driver);

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

// Statistical calculations
function calculateResult(calc: (array: number[]) => number) {
  return (result: Record<string, number[]>): StatisticalResult => {
    const calculatedResult: StatisticalResult = {};
    for (const key of Object.keys(result)) {
      if (result[key].length > 0) {
        calculatedResult[key] = calc(result[key]);
      }
    }
    return calculatedResult;
  };
}

const calculateSum = (array: number[]): number =>
  array.reduce((sum, val) => sum + val, 0);
const calculateMean = (array: number[]): number =>
  array.length > 0 ? calculateSum(array) / array.length : 0;
const minResult = calculateResult((array: number[]) => Math.min(...array));
const maxResult = calculateResult((array: number[]) => Math.max(...array));
const meanResult = calculateResult((array: number[]) => calculateMean(array));
const standardDeviationResult = calculateResult((array: number[]) => {
  if (array.length <= 1) return 0;
  const average = calculateMean(array);
  const squareDiffs = array.map((value) => Math.pow(value - average, 2));
  return Math.sqrt(calculateMean(squareDiffs));
});

function pResult(array: Record<string, number[]>, p: number): StatisticalResult {
  return calculateResult((arr: number[]) => {
    const index = Math.floor((p / 100.0) * arr.length);
    return arr[index];
  })(array);
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
    mean: meanResult(result),
    min: minResult(result),
    max: maxResult(result),
    stdDev: standardDeviationResult(result),
    p75: pResult(result, 75),
    p95: pResult(result, 95),
  };

  return results;
}
