import { promises as fs } from 'fs';
import path from 'path';
import { mean as calculateMean } from 'lodash';
import {
  BenchmarkMetrics,
  BenchmarkSummary,
} from '../test/e2e/page-objects/benchmark/page-load-benchmark';

/**
 * Structure of the benchmark results output file.
 * Contains aggregated performance data and raw measurement results.
 */
type BenchmarkOutput = {
  /** Timestamp when the benchmark was executed */
  timestamp: number;
  /** Git commit SHA (shortened) */
  commit: string;
  /** Statistical summary for each tested page */
  summary: BenchmarkSummary[];
  /** Raw benchmark measurements for detailed analysis */
  rawResults: unknown[];
};

/**
 * Structure for historical benchmark data from the stats repository
 */
type HistoricalBenchmarkData = {
  [commitHash: string]: BenchmarkOutput;
};

/**
 * Key metrics to be tracked and shared in bot PR commentary
 */
enum KeyMetrics {
  PageLoadTime = 'pageLoadTime',
  DomContentLoaded = 'domContentLoaded',
  FirstContentfulPaint = 'firstContentfulPaint',
}

/**
 * Constants to determine which indicating performance level indicating Emoji should be rendered in {@link getEmojiForMetric} util function.
 */
const EMOJI_RENDERING_THRESHOLDS: Record<
  string,
  { good: number; warning: number }
> = {
  [KeyMetrics.PageLoadTime]: { good: 1000, warning: 2000 },
  [KeyMetrics.DomContentLoaded]: { good: 1200, warning: 2500 },
  [KeyMetrics.FirstContentfulPaint]: { good: 800, warning: 1500 },
};

/**
 * Constants to determine a significant increase threshold for metrics, used in {@link hasSignificantIncrease} util function.
 */
const SIGNIFICANT_PERCENT_INCREASE_THRESHOLDS: Record<string, number> = {
  [KeyMetrics.PageLoadTime]: 0.25,
  [KeyMetrics.DomContentLoaded]: 0.2,
  [KeyMetrics.FirstContentfulPaint]: 1.5,
};

/**
 * Aggregates historical benchmark data from the stats repository into a single object.
 *
 * @param commitHashes - The commit hashes to aggregate
 * @param data - Historical benchmark data from the stats repository
 * @param n - The number of commits to aggregate
 * @returns Aggregated benchmark data
 */
function aggregateHistoricalBenchmarkData(
  commitHashes: string[],
  data: HistoricalBenchmarkData,
  n: number,
): BenchmarkOutput {
  // Take the latest N commits (or all if less than N)
  const latestCommits = commitHashes.slice(0, n);
  console.log(
    `Processing ${latestCommits.length} commits: ${latestCommits.join(', ')}`,
  );

  // Calculate mean of means for each page and metric
  const aggregatedData: BenchmarkOutput = {
    timestamp: Date.now(), // Use current timestamp
    commit: latestCommits[0], // Use the latest commit hash as representative
    summary: [],
    rawResults: [],
  };

  // Get all unique pages from all commits
  const allPages = new Set<string>();
  latestCommits.forEach((commitHash) => {
    const commitData = data[commitHash];
    if (commitData?.summary) {
      commitData.summary.forEach((pageSummary) => {
        allPages.add(pageSummary.page);
      });
    }
  });

  // For each page, calculate mean of means for key metrics only
  allPages.forEach((pageName) => {
    const pageData: BenchmarkSummary = {
      page: pageName,
      samples: 0, // Not used downstream
      mean: {} as BenchmarkMetrics,
      standardDeviation: {} as BenchmarkMetrics,
      min: {} as BenchmarkMetrics,
      max: {} as BenchmarkMetrics,
      p95: {} as BenchmarkMetrics,
      p99: {} as BenchmarkMetrics,
    };

    // Collect mean values for key metrics across all commits
    const metricMeans: Record<string, number[]> = {};

    latestCommits.forEach((commitHash) => {
      const commitData = data[commitHash];
      const pageSummary = commitData?.summary?.find((p) => p.page === pageName);

      if (pageSummary?.mean) {
        // Only collect key metrics
        Object.values(KeyMetrics).forEach((metricKey) => {
          const metricValue =
            pageSummary.mean[
              metricKey as keyof Omit<BenchmarkMetrics, 'memoryUsage'>
            ];
          if (typeof metricValue === 'number') {
            if (!metricMeans[metricKey]) {
              metricMeans[metricKey] = [];
            }
            metricMeans[metricKey].push(metricValue);
          }
        });
      }
    });

    // Calculate mean of means for each key metric
    Object.keys(metricMeans).forEach((metricKey) => {
      const values = metricMeans[metricKey];
      if (values.length > 0) {
        const calculatedMean = calculateMean(values);
        pageData.mean[
          metricKey as keyof Omit<BenchmarkMetrics, 'memoryUsage'>
        ] = calculatedMean;
      }
    });

    aggregatedData.summary.push(pageData);
  });
  return aggregatedData;
}

/**
 * Fetches the latest benchmark data from the main branch of the extension_benchmark_stats repository
 *
 * @param n - The number of commits to fetch
 * Returns the mean of means from the latest N commits (or all available if less than N)
 */
async function fetchLatestMainBenchmarkData(
  n: number,
): Promise<BenchmarkOutput | null> {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/MetaMask/extension_benchmark_stats/main/stats/page_load_data.json',
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch historical benchmark data: ${response.statusText}`,
      );
      return null;
    }

    const data: HistoricalBenchmarkData = await response.json();
    const commitHashes = Object.keys(data).reverse(); // Sort by commit hash, newest first

    if (commitHashes.length === 0) {
      console.warn('No benchmark data found');
      return null;
    }

    // Take the latest N commits (or all if less than N)
    const latestCommits = commitHashes.slice(0, n);
    console.log(
      `Processing ${latestCommits.length} commits: ${latestCommits.join(', ')}`,
    );

    return aggregateHistoricalBenchmarkData(latestCommits, data, n);
  } catch (error) {
    console.warn('Error fetching historical benchmark data:', error);
    return null;
  }
}

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
 * @returns Emoji indicating performance level: 🟢 (good), 🟡 (warning), 🔴 (poor), or ⚪ (neutral)
 */
function getEmojiForMetric(metric: string, value: number): string {
  const threshold = EMOJI_RENDERING_THRESHOLDS[metric];
  if (!threshold) {
    return '⚪';
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
 * Returns a comparison emoji based on whether the current value is better, worse, or similar to the reference value
 *
 * @param current - Current metric value
 * @param reference - Reference metric value
 * @returns Comparison emoji: ⬇️ (better), ⬆️ (worse), or ➡️ (similar)
 */
function getComparisonEmoji(current: number, reference: number): string {
  const diff = current - reference;

  if (diff === 0) {
    return '➡️';
  }
  return diff < 0 ? '⬇️' : '⬆️'; // Down arrow for better (lower), up arrow for worse (higher)
}

/**
 * Checks if a metric has increased a significant amount compared to the reference value
 *
 * @param metric - Name of the metric to compare
 * @param current - Current metric value
 * @param reference - Reference metric value
 * @returns True if the metric has increased by a significant amount
 */
function hasSignificantIncrease(
  metric: KeyMetrics,
  current: number,
  reference: number,
): boolean {
  const diff = current - reference;
  const percentIncrease = diff / reference;
  return percentIncrease >= SIGNIFICANT_PERCENT_INCREASE_THRESHOLDS[metric];
}

/**
 * Formats a single metric row for the benchmark summary comment with comparison.
 * Includes metric name, formatted mean values for both current and reference commits, and performance emojis.
 *
 * @param metricName - Name of the performance metric
 * @param currentMean - Current commit mean value in milliseconds
 * @param currentStdDev - Current commit standard deviation in milliseconds
 * @param referenceMean - Historical mean value in milliseconds
 * @returns Formatted markdown row string
 */
function formatMetricRowWithComparison(
  metricName: string,
  currentMean: number,
  currentStdDev: number,
  referenceMean: number,
): string {
  const currentEmoji = getEmojiForMetric(metricName, currentMean);
  const comparisonEmoji = getComparisonEmoji(currentMean, referenceMean);
  const currentFormatted = formatTime(currentMean);
  const currentStdDevFormatted = formatStandardDeviation(
    currentMean,
    currentStdDev,
  );
  const referenceFormatted = formatTime(referenceMean);

  return `- **${metricName}**-> current mean value: ${currentFormatted}${currentStdDevFormatted} ${currentEmoji} | historical mean value: ${referenceFormatted} ${comparisonEmoji} (historical data)`;
}

/**
 * Formats a single metric row for the benchmark summary comment (original version without comparison).
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
 * Extracts metric values from a benchmark summary for a given metric name
 *
 * @param summary - Benchmark summary containing metric data
 * @param metric - Name of the metric to extract
 * @returns Object containing mean and standard deviation, or null if metric is not a number
 */
function getMetricValues(
  summary: BenchmarkSummary,
  metric: string,
): { mean: number; stdDev: number } | null {
  const meanValue =
    summary.mean[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
  const stdDevValue =
    summary.standardDeviation[
      metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>
    ];

  if (typeof meanValue !== 'number') {
    return null;
  }

  return {
    mean: meanValue,
    stdDev: stdDevValue || 0,
  };
}

/**
 * Processes a single metric for comparison and returns the formatted row
 *
 * @param metric - Name of the metric to process
 * @param currentValues - Current metric values (mean and standard deviation)
 * @param currentValues.mean - Mean value
 * @param currentValues.stdDev - Standard deviation value
 * @param page - Name of the page being processed
 * @param significantIncreases - Array to track significant performance increases
 * @param [referenceData] - Reference benchmark data for comparison
 * @returns Formatted metric row string
 */
function processMetricForComparison(
  metric: KeyMetrics,
  currentValues: { mean: number; stdDev: number },
  page: string,
  significantIncreases: {
    page: string;
    metric: string;
    current: number;
    reference: number;
    percentIncrease: number;
  }[],
  referenceData?: BenchmarkOutput | null,
): string {
  if (!referenceData) {
    return formatMetricRow(metric, currentValues.mean, currentValues.stdDev);
  }

  const referencePage = referenceData.summary?.find((ref) => ref.page === page);
  if (!referencePage) {
    return formatMetricRow(metric, currentValues.mean, currentValues.stdDev);
  }

  const referenceValues = getMetricValues(referencePage, metric);
  if (!referenceValues) {
    return formatMetricRow(metric, currentValues.mean, currentValues.stdDev);
  }

  if (
    hasSignificantIncrease(metric, currentValues.mean, referenceValues.mean)
  ) {
    const percentIncrease =
      ((currentValues.mean - referenceValues.mean) / referenceValues.mean) *
      100;
    significantIncreases.push({
      page,
      metric,
      current: currentValues.mean,
      reference: referenceValues.mean,
      percentIncrease,
    });
  }

  return formatMetricRowWithComparison(
    metric,
    currentValues.mean,
    currentValues.stdDev,
    referenceValues.mean,
  );
}

/**
 * Generates a comprehensive markdown comment for pull request benchmark results.
 * Creates a structured report with summary metrics, detailed statistics, and performance indicators.
 *
 * @param benchmarkData - Benchmark results data containing summary and metadata
 * @param [referenceData] - Reference benchmark data from main branch for comparison
 * @returns Formatted markdown comment string ready for posting to GitHub
 */
function generateBenchmarkComment(
  benchmarkData: BenchmarkOutput,
  referenceData?: BenchmarkOutput | null,
): string {
  const { summary, commit, timestamp } = benchmarkData;

  if (!summary || summary.length === 0) {
    return '## 📊 Page Load Benchmark Results\n\n❌ No benchmark results available.';
  }

  const shortCommit = commit.slice(0, 7);
  const date = new Date(timestamp).toLocaleDateString();
  const referenceCommit = referenceData?.commit?.slice(0, 7);

  let comment = `## 📊 Page Load Benchmark Results\n\n`;
  comment += `**Current Commit**: \`${shortCommit}\` | **Reference Commit**: \`${referenceCommit}\` | **Date**: ${date}\n\n`;

  // Track significant increases for warning
  const significantIncreases: {
    page: string;
    metric: string;
    current: number;
    reference: number;
    percentIncrease: number;
  }[] = [];

  for (const pageSummary of summary) {
    const { page, samples, mean } = pageSummary;

    comment += `### 📄 ${page}\n\n`;
    comment += `**Samples**: ${samples}\n\n`;

    // Create summary section with key metrics
    comment += `#### Summary\n`;

    for (const metric of Object.values(KeyMetrics)) {
      const currentValues = getMetricValues(pageSummary, metric);
      if (!currentValues) {
        continue;
      }

      const metricRow = processMetricForComparison(
        metric,
        currentValues,
        page,
        significantIncreases,
        referenceData,
      );
      comment += `${metricRow}\n`;
    }

    // Create detailed results section
    comment += `\n<details>\n<summary>📈 Detailed Results</summary>\n\n`;
    comment += `| Metric | Mean | Std Dev | Min | Max | P95 | P99 |\n`;
    comment += `|--------|------|---------|-----|-----|-----|-----|\n`;

    const allMetrics = Object.keys(mean);
    for (const metric of allMetrics) {
      const currentValues = getMetricValues(pageSummary, metric);
      if (!currentValues) {
        continue;
      }

      const minValue =
        pageSummary.min[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const maxValue =
        pageSummary.max[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const p95Value =
        pageSummary.p95[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const p99Value =
        pageSummary.p99[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];

      comment += `| ${metric} | ${formatTime(currentValues.mean)} | ${formatTime(currentValues.stdDev)} | ${formatTime(minValue || 0)} | ${formatTime(maxValue || 0)} | ${formatTime(p95Value || 0)} | ${formatTime(p99Value || 0)} |\n`;
    }

    comment += `\n</details>\n\n`;
  }

  // Add warning section if there are significant increases
  if (significantIncreases.length > 0) {
    comment += `## ⚠️ Performance Warning\n\n`;
    comment += `**🚨 Significant performance regression detected!**\n\n`;
    comment += `The following metrics have increased by a significant amount compared to the reference commit. This should be investigated before proceeding with this PR:\n\n`;

    for (const increase of significantIncreases) {
      const currentFormatted = formatTime(increase.current);
      const referenceFormatted = formatTime(increase.reference);
      comment += `- **${increase.page} - ${increase.metric}**: ${currentFormatted} vs ${referenceFormatted} (**+${increase.percentIncrease.toFixed(1)}%**)\n`;
    }

    comment += `\n`;
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
  const { PR_COMMENT_TOKEN, OWNER, REPOSITORY, PR_NUMBER } =
    process.env as Record<string, string>;
  const N_COMMITS = 10;

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

  const referenceData = await fetchLatestMainBenchmarkData(N_COMMITS);

  const commentBody = generateBenchmarkComment(benchmarkData, referenceData);
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
