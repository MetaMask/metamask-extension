import { promises as fs } from 'fs';
import path from 'path';

type BenchmarkMetrics = {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  contentScriptLoadTime: number;
  backgroundScriptInitTime: number;
  totalExtensionLoadTime: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

type BenchmarkSummary = {
  page: string;
  samples: number;
  mean: Partial<BenchmarkMetrics>;
  p95: Partial<BenchmarkMetrics>;
  p99: Partial<BenchmarkMetrics>;
  min: Partial<BenchmarkMetrics>;
  max: Partial<BenchmarkMetrics>;
  standardDeviation: Partial<BenchmarkMetrics>;
};

type BenchmarkOutput = {
  timestamp: string;
  commit: string;
  summary: BenchmarkSummary[];
  rawResults: any[];
};

function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatStandardDeviation(mean: number, stdDev: number): string {
  if (!mean || !stdDev) return '';
  return ` (±${formatTime(stdDev)})`;
}

function getEmojiForMetric(metric: string, value: number): string {
  // Define thresholds for different metrics
  const thresholds: Record<string, { good: number; warning: number }> = {
    pageLoadTime: { good: 1000, warning: 2000 },
    firstContentfulPaint: { good: 800, warning: 1500 },
    largestContentfulPaint: { good: 1200, warning: 2500 },
    totalExtensionLoadTime: { good: 500, warning: 1000 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return '📊';

  if (value <= threshold.good) return '🟢';
  if (value <= threshold.warning) return '🟡';
  return '🔴';
}

function formatMetricRow(
  metricName: string,
  mean: number,
  stdDev: number,
  samples: number,
): string {
  const emoji = getEmojiForMetric(metricName, mean);
  const formattedMean = formatTime(mean);
  const formattedStdDev = formatStandardDeviation(mean, stdDev);

  return `- **${metricName}**: ${formattedMean}${formattedStdDev} ${emoji}`;
}

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
      'totalExtensionLoadTime'
    ];

    for (const metric of keyMetrics) {
      const meanValue = mean[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const stdDevValue = standardDeviation[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];

      if (typeof meanValue === 'number') {
        comment += formatMetricRow(metric, meanValue, stdDevValue || 0, samples) + '\n';
      }
    }

    // Create detailed results section
    comment += `\n<details>\n<summary>📈 Detailed Results</summary>\n\n`;
    comment += `| Metric | Mean | Std Dev | Min | Max | P95 | P99 |\n`;
    comment += `|--------|------|---------|-----|-----|-----|-----|\n`;

    const allMetrics = Object.keys(mean);
    for (const metric of allMetrics) {
      const meanValue = mean[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const stdDevValue = standardDeviation[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const minValue = pageSummary.min[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const maxValue = pageSummary.max[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const p95Value = pageSummary.p95[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];
      const p99Value = pageSummary.p99[metric as keyof Omit<BenchmarkMetrics, 'memoryUsage'>];

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

async function main(): Promise<void> {
  const {
    PR_COMMENT_TOKEN,
    OWNER,
    REPOSITORY,
    PR_NUMBER,
    GITHUB_SHA,
  } = process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn('No pull request detected, skipping benchmark comment');
    return;
  }

  if (!PR_COMMENT_TOKEN) {
    console.warn('PR_COMMENT_TOKEN not provided, skipping benchmark comment');
    return;
  }

  // Try to find benchmark results file
  const possiblePaths = [
    'test-artifacts/benchmarks/benchmark-results.json',
    'benchmark-results.json',
    path.join(process.cwd(), 'benchmark-results.json'),
  ];

  let benchmarkData: BenchmarkOutput | null = null;
  let resultsPath = '';

  for (const filePath of possiblePaths) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      benchmarkData = JSON.parse(fileContent) as BenchmarkOutput;
      resultsPath = filePath;
      console.log(`Found benchmark results at: ${filePath}`);
      break;
    } catch (error) {
      console.log(`Could not read benchmark results from: ${filePath}`);
    }
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
