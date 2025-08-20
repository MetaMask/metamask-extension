import { promises as fs } from 'fs';
import path from 'path';
import {
  BenchmarkMetrics,
  BenchmarkSummary,
} from '../test/e2e/page-objects/benchmark/page-load-benchmark';

/**
 * Structure of the benchmark results output file.
 * Contains aggregated performance data and raw measurement results.
 */
type BenchmarkOutput = {
  /** ISO timestamp when the benchmark was executed */
  timestamp: string;
  /** Git commit SHA (shortened) */
  commit: string;
  /** Statistical summary for each tested page */
  summary: BenchmarkSummary[];
  /** Raw benchmark measurements for detailed analysis */
  rawResults: unknown[];
};

/**
 * Formats a time value in milliseconds to a human-readable string.
 * Values under 1000ms are displayed in milliseconds, larger values in seconds.
 *
 * @param ms - Time value in milliseconds
 * @returns Formatted time string (ex.: "500ms" or "1.25s")
 */
function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formats standard deviation as a parenthetical addition to the mean value.
 * Returns empty string if either mean or standard deviation is falsy.
 *
 * @param mean - Mean value
 * @param stdDev - Standard deviation value
 * @returns Formatted standard deviation string (ex.: " (±150ms)") or empty string
 */
function formatStandardDeviation(mean: number, stdDev: number): string {
  if (!mean || !stdDev) {
    return '';
  }
  return ` (±${formatTime(stdDev)})`;
}

/**
 * Returns an appropriate emoji based on the metric value and performance thresholds.
 * Uses Core Web Vitals thresholds for key metrics, returns neutral emoji for others.
 *
 * @param metric - Name of the performance metric
 * @param value - Measured value in milliseconds
 * @returns Emoji indicating performance level: 🟢 (good), 🟡 (warning), 🔴 (poor), or 📊 (neutral)
 */
function getEmojiForMetric(metric: string, value: number): string {
  const thresholds: Record<string, { good: number; warning: number }> = {
    pageLoadTime: { good: 1000, warning: 2000 },
    firstContentfulPaint: { good: 800, warning: 1500 },
    largestContentfulPaint: { good: 1200, warning: 2500 },
  };

  const threshold = thresholds[metric];
  if (!threshold) {
    return '📊';
  }
  if (value <= threshold.good) {
    return '🟢';
  }
  if (value <= threshold.warning) {
    return '🟡';
  }
  return '🔴';
}

/**
 * Formats a single metric row for the benchmark summary comment.
 * Includes metric name, formatted mean value, standard deviation, and performance emoji.
 *
 * @param metricName - Name of the performance metric
 * @param mean - Mean value in milliseconds
 * @param stdDev - Standard deviation in milliseconds
 * @returns Formatted markdown row string (ex.: "- **pageLoadTime**: 1.25s (±150ms) 🟢")
 */
function formatMetricRow(
  metricName: string,
  mean: number,
  stdDev: number,
): string {
  const emoji = getEmojiForMetric(metricName, mean);
  const formattedMean = formatTime(mean);
  const formattedStdDev = formatStandardDeviation(mean, stdDev);

  return `- **${metricName}**: ${formattedMean}${formattedStdDev} ${emoji}`;
}

/**
 * Generates a comprehensive markdown comment for pull request benchmark results.
 * Creates a structured report with summary metrics, detailed statistics, and performance indicators.
 *
 * @param benchmarkData - Benchmark results data containing summary and metadata
 * @returns Formatted markdown comment string ready for posting to GitHub
 */
function generateBenchmarkComment(benchmarkData: BenchmarkOutput): string {
  const { summary, commit, timestamp } = benchmarkData;

  if (!summary || summary.length === 0) {
    return '## 📊 Page Load Benchmark Results\n\n❌ No benchmark results available.';
  }

  const shortCommit = commit.slice(0, 7);
  const date = new Date(timestamp).toLocaleDateString();

  let comment = `## 📊 Page Load Benchmark Results\n\n`;
  comment += `**Commit**: \`${shortCommit}\` | **Date**: ${date}\n\n`;

  for (const pageSummary of summary) {
    const { page, samples, mean, standardDeviation } = pageSummary;

    comment += `### 📄 ${page}\n\n`;
    comment += `**Samples**: ${samples}\n\n`;

    // Create summary section with key metrics
    comment += `#### Summary\n`;

    const keyMetrics = [
      'pageLoadTime',
      'firstContentfulPaint',
      'largestContentfulPaint',
    ];

    for (const metric of keyMetrics) {
      const meanValue =
        mean[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const stdDevValue =
        standardDeviation[
          metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>
        ];

      if (typeof meanValue === 'number') {
        comment += `${formatMetricRow(metric, meanValue, stdDevValue || 0)}\n`;
      }
    }

    // Create detailed results section
    comment += `\n<details>\n<summary>📈 Detailed Results</summary>\n\n`;
    comment += `| Metric | Mean | Std Dev | Min | Max | P95 | P99 |\n`;
    comment += `|--------|------|---------|-----|-----|-----|-----|\n`;

    const allMetrics = Object.keys(mean);
    for (const metric of allMetrics) {
      const meanValue =
        mean[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const stdDevValue =
        standardDeviation[
          metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>
        ];
      const minValue =
        pageSummary.min[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const maxValue =
        pageSummary.max[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const p95Value =
        pageSummary.p95[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const p99Value =
        pageSummary.p99[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];

      if (typeof meanValue === 'number') {
        comment += `| ${metric} | ${formatTime(meanValue)} | ${formatTime(stdDevValue || 0)} | ${formatTime(minValue || 0)} | ${formatTime(maxValue || 0)} | ${formatTime(p95Value || 0)} | ${formatTime(p99Value || 0)} |\n`;
      }
    }

    comment += `\n</details>\n\n`;
  }

  comment += `---\n\n`;
  comment += `*Results generated automatically by MetaMask CI*`;

  return comment;
}

/**
 * Main function that orchestrates the benchmark comment posting process.
 * Reads benchmark results from file, generates a formatted comment, and posts it to the pull request.
 *
 * Required environment variables:
 * - PR_COMMENT_TOKEN: GitHub token with permission to comment on PRs
 * - OWNER: Repository owner (ex.: "MetaMask")
 * - REPOSITORY: Repository name (ex.: "metamask-extension")
 * - PR_NUMBER: Pull request number to comment on
 *
 * @throws {Error} When GitHub API request fails or required environment variables are missing
 */
async function main(): Promise<void> {
  // TODO: [ffmcgee] retrieve `GITHUB_SHA` from `process.env` to use when saving historical data
  const { PR_COMMENT_TOKEN, OWNER, REPOSITORY, PR_NUMBER } =
    process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn('No pull request detected, skipping benchmark comment');
    return;
  }

  if (!PR_COMMENT_TOKEN) {
    console.warn('PR_COMMENT_TOKEN not provided, skipping benchmark comment');
    return;
  }

  const filePath = path.join(
    process.cwd(),
    'test-artifacts/benchmarks/benchmark-results.json',
  );

  let benchmarkData: BenchmarkOutput | null = null;

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    benchmarkData = JSON.parse(fileContent) as BenchmarkOutput;
    console.log(`Found benchmark results at: ${filePath}`);
  } catch (error) {
    console.log(`Could not read benchmark results from: ${filePath}`);
  }

  if (!benchmarkData) {
    console.warn('No benchmark results found, skipping comment');
    return;
  }

  // Generate comment
  const commentBody = generateBenchmarkComment(benchmarkData);
  console.log('Generated comment:');
  console.log(commentBody);

  // Post comment to PR
  const JSON_PAYLOAD = JSON.stringify({ body: commentBody });
  const POST_COMMENT_URI = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/issues/${PR_NUMBER}/comments`;

  console.log(`Posting to: ${POST_COMMENT_URI}`);

  const response = await fetch(POST_COMMENT_URI, {
    method: 'POST',
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      Authorization: `token ${PR_COMMENT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Post comment failed with status '${response.statusText}': ${errorText}`,
    );
  }

  const responseData = await response.json();
  console.log(`Comment posted successfully: ${responseData.html_url}`);
}

main().catch((error) => {
  console.error('Error posting benchmark comment:', error);
  process.exit(1);
});
