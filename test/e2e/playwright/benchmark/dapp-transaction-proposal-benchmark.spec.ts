import path from 'path';
import { promises as fs } from 'fs';
import { test as pwTest, expect } from '@playwright/test';
import { PageLoadBenchmark } from '../../page-objects/benchmark/page-load-benchmark';
import { DAPP_URL } from '../../constants';

pwTest.describe('Wallet Pop Open Time on Dapp Transaction Proposal', () => {
  let benchmark: PageLoadBenchmark;
  const outputPath = path.join(
    process.cwd(),
    '/test-artifacts/benchmarks/wallet-pop-open-time-benchmark-results.json',
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

  pwTest('Run wallet pop open time benchmark', async () => {
    const proposalTypes = ['signTypedDataV4'];

    const browserLoads = parseInt(
      process.env.BENCHMARK_BROWSER_LOADS || '5',
      10,
    );
    const proposalLoads = parseInt(
      process.env.BENCHMARK_PROPOSAL_LOADS || '5',
      10,
    );

    await benchmark.runTransactionProposalBenchmark(
      proposalTypes,
      browserLoads,
      proposalLoads,
    );
    await benchmark.saveTransactionProposalResults(outputPath);

    const results = benchmark.calculateTransactionProposalStatistics();
    expect(results.length).toBeGreaterThan(0);

    for (const summary of results) {
      expect(summary.samples).toBeGreaterThan(0);
      expect(summary.mean.popOpenTime).toBeGreaterThan(0);
      expect(summary.mean.popupAppearTime).toBeGreaterThan(0);
      expect(summary.mean.popupInteractiveTime).toBeGreaterThan(0);
    }
  });
});
