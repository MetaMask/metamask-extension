import path from 'path';
import { promises as fs } from 'fs';
import { test as pwTest, expect } from '@playwright/test';
import { DAPP_PAGE_LOAD_BENCHMARK_ARTIFACT_FILENAME } from '../../utils/constants';
import { DAPP_URL } from '../../../constants';
import { PageLoadBenchmark } from './dapp-page-load-benchmark';
import { dappPageLoadStatsToBenchmarkResults } from './dapp-page-load-stats';

pwTest.describe('Page Load Benchmark', () => {
  let benchmark: PageLoadBenchmark;
  const outputPath = path.join(
    process.cwd(),
    'test-artifacts/benchmarks',
    DAPP_PAGE_LOAD_BENCHMARK_ARTIFACT_FILENAME,
  );

  pwTest.beforeAll(async () => {
    await fs.mkdir(`${process.cwd()}/test-artifacts/benchmarks`, {
      recursive: true,
    });
    const extensionPath = path.join(process.cwd(), 'dist', 'chrome');
    benchmark = new PageLoadBenchmark(extensionPath);
    await benchmark.setup();
  });

  pwTest.afterAll(async () => {
    await benchmark.cleanup();
  });

  pwTest('Run page load benchmark', async () => {
    const testUrls = [DAPP_URL];

    const browserLoads = parseInt(
      process.env.BENCHMARK_BROWSER_LOADS || '10',
      10,
    );
    const pageLoads = parseInt(process.env.BENCHMARK_PAGE_LOADS || '10', 10);

    await benchmark.runBenchmark(testUrls, browserLoads, pageLoads);

    const results = benchmark.calculateStatistics();
    const perfFormat = dappPageLoadStatsToBenchmarkResults(results);
    await fs.writeFile(outputPath, JSON.stringify(perfFormat, null, 2));

    expect(results.length).toBeGreaterThan(0);

    for (const summary of results) {
      const pageLoadTimer = summary.timers.find((t) => t.id === 'pageLoadTime');
      expect(pageLoadTimer).toBeDefined();
      expect(pageLoadTimer?.samples).toBeGreaterThan(0);
      expect(pageLoadTimer?.mean).toBeGreaterThan(0);
    }
  });
});
