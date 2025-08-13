import path from 'path';
import { test as pwTest, expect } from '@playwright/test';
import { PageLoadBenchmark } from '../../page-objects/benchmark/page-load-benchmark';

pwTest.describe('Page Load Benchmark', () => {
  let benchmark: PageLoadBenchmark;
  const outputPath = path.join(process.cwd(), 'benchmark-results.json');

  pwTest.beforeAll(async () => {
    const extensionPath = path.join(process.cwd(), 'dist', 'chrome');
    benchmark = new PageLoadBenchmark(extensionPath);
    await benchmark.setup();
  });

  pwTest.afterAll(async () => {
    await benchmark.cleanup();
  });

  pwTest('Run page load benchmark', async () => {
    const testUrls = ['https://metamask.github.io/test-dapp/'];

    const browserLoads = parseInt(
      process.env.BENCHMARK_BROWSER_LOADS || '10',
      10,
    );
    const pageLoads = parseInt(process.env.BENCHMARK_PAGE_LOADS || '10', 10);

    await benchmark.runBenchmark(testUrls, browserLoads, pageLoads);
    await benchmark.saveResults(outputPath);

    const results = benchmark.calculateStatistics();
    expect(results.length).toBeGreaterThan(0);

    for (const summary of results) {
      expect(summary.samples).toBeGreaterThan(0);
      expect(summary.mean.pageLoadTime).toBeGreaterThan(0);
    }
  });
});
