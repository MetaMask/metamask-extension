#!/usr/bin/env tsx

import { execSync } from 'child_process';
import path from 'path';

/**
 * Script to run the page load benchmark with proper configuration
 *
 * Usage:
 * yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts
 * yarn tsx test/e2e/playwright/benchmark/run-benchmark.ts --browser-loads=5 --page-loads=5
 */

const args = process.argv.slice(2);
const browserLoads =
  args.find((arg) => arg.startsWith('--browser-loads='))?.split('=')[1] || '10';
const pageLoads =
  args.find((arg) => arg.startsWith('--page-loads='))?.split('=')[1] || '10';

console.log('🚀 Starting MetaMask Page Load Benchmark');
console.log(
  `📊 Configuration: ${browserLoads} browser loads, ${pageLoads} page loads per browser`,
);
console.log(`📁 Working directory: ${process.cwd()}`);

// Set environment variables
process.env.BENCHMARK_BROWSER_LOADS = browserLoads;
process.env.BENCHMARK_PAGE_LOADS = pageLoads;

// Ensure we're in the right directory
const projectRoot = path.resolve(__dirname, '../../../../');
process.chdir(projectRoot);

try {
  // Build the extension first
  console.log('🔨 Building extension...');
  execSync('yarn build:test', { stdio: 'inherit' });

  // Run the benchmark
  console.log('🧪 Running benchmark...');
  execSync(`yarn playwright test --project=benchmark --reporter=list,html`, {
    stdio: 'inherit',
    env: { ...process.env },
  });

  console.log('✅ Benchmark completed successfully!');
} catch (error) {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
}
