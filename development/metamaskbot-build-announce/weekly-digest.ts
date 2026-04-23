/**
 * Weekly Performance Quality Gate Digest
 *
 * Collects metrics from the past week and posts a summary to Slack:
 * - False positive rate
 * - Metric graduation status
 * - Regression count (real vs flake)
 * - Skip-label usage
 * - Graduation readiness per metric
 *
 * Usage: yarn tsx development/metamaskbot-build-announce/weekly-digest.ts
 *
 * Environment: SLACK_BENCHMARK_WEBHOOK_URL, GITHUB_TOKEN, OWNER, REPOSITORY
 */

import { formatWeeklyDigest, postToSlack } from './slack-notifications';
import type { WeeklyDigestData } from './slack-notifications';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FALSE_POSITIVE_TARGET = 0.05;

/* eslint-disable @typescript-eslint/naming-convention */
type GitHubWorkflowRun = {
  id: number;
  conclusion: string | null;
  created_at: string;
  html_url: string;
  head_sha: string;
  pull_requests: { number: number }[];
};
type GitHubWorkflowRunsResponse = { workflow_runs: GitHubWorkflowRun[] };
type GitHubIssue = {
  number: number;
  body: string;
  pull_request?: unknown;
};
/* eslint-enable @typescript-eslint/naming-convention */

async function fetchRecentWorkflowRuns(
  owner: string,
  repo: string,
  token: string,
): Promise<GitHubWorkflowRun[]> {
  const since = new Date(Date.now() - WEEK_MS).toISOString();
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/main.yml/runs?created=>${since}&per_page=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = (await response.json()) as GitHubWorkflowRunsResponse;
  return data.workflow_runs;
}

async function fetchPRsWithLabel(
  owner: string,
  repo: string,
  token: string,
  label: string,
): Promise<{ number: number; body: string }[]> {
  const since = new Date(Date.now() - WEEK_MS).toISOString();
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?labels=${encodeURIComponent(label)}&since=${since}&state=all&per_page=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const issues = (await response.json()) as GitHubIssue[];
  // Only include pull requests (not plain issues)
  return issues
    .filter((i) => i.pull_request)
    .map((i) => ({ number: i.number, body: i.body ?? '' }));
}

/**
 * Heuristic: count benchmark failures vs total runs.
 * A "false positive" is a run that failed benchmark checks but
 * whose PR was subsequently merged (implying the failure was not real).
 *
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param token - GitHub API token.
 */
async function computeFalsePositiveRate(
  owner: string,
  repo: string,
  token: string,
): Promise<{ rate: number; total: number; real: number; flake: number }> {
  const runs = await fetchRecentWorkflowRuns(owner, repo, token);

  // Filter to benchmark-related failures
  const benchmarkFailures = runs.filter((r) => r.conclusion === 'failure');
  const totalRuns = runs.length;

  if (totalRuns === 0) {
    return { rate: 0, total: 0, real: 0, flake: 0 };
  }

  // Check which failed PRs were merged (likely false positives)
  let flakeCount = 0;
  let realCount = 0;

  for (const run of benchmarkFailures) {
    if (run.pull_requests.length > 0) {
      const prNumber = run.pull_requests[0].number;
      const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
      const prResponse = await fetch(prUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (prResponse.ok) {
        const pr = (await prResponse.json()) as { merged: boolean };
        if (pr.merged) {
          flakeCount += 1;
        } else {
          realCount += 1;
        }
      } else {
        realCount += 1;
      }
    } else {
      realCount += 1;
    }
  }

  const rate =
    benchmarkFailures.length > 0 ? flakeCount / benchmarkFailures.length : 0;
  return {
    rate,
    total: benchmarkFailures.length,
    real: realCount,
    flake: flakeCount,
  };
}

async function main(): Promise<void> {
  const {
    SLACK_BENCHMARK_WEBHOOK_URL,
    GITHUB_TOKEN,
    OWNER = 'MetaMask',
    REPOSITORY = 'metamask-extension',
  } = process.env;

  if (!SLACK_BENCHMARK_WEBHOOK_URL) {
    console.error('SLACK_BENCHMARK_WEBHOOK_URL is required');
    process.exit(1);
  }

  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is required');
    process.exit(1);
  }

  const fpData = await computeFalsePositiveRate(
    OWNER,
    REPOSITORY,
    GITHUB_TOKEN,
  );

  const skipPRs = await fetchPRsWithLabel(
    OWNER,
    REPOSITORY,
    GITHUB_TOKEN,
    'skip-benchmark-gate',
  );

  // TODO: When graduation tracking is implemented (#6841), read
  // actual graduation data from the config. For now, use placeholders.
  const digestData: WeeklyDigestData = {
    falsePositiveRate: fpData.rate,
    falsePositiveTarget: FALSE_POSITIVE_TARGET,
    metricsPromoted: [],
    totalEnforced: Object.keys(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../test/e2e/benchmarks/utils/thresholds').THRESHOLD_REGISTRY,
    ).length,
    totalMetrics: 31, // approximate total including non-enforced
    regressionsThisWeek: {
      total: fpData.total,
      real: fpData.real,
      flake: fpData.flake,
    },
    skipLabelUses: skipPRs.map((pr) => ({
      prNumber: String(pr.number),
      reason: extractSkipReason(pr.body),
    })),
    graduationReadiness: [],
  };

  const payload = formatWeeklyDigest(digestData);
  await postToSlack(SLACK_BENCHMARK_WEBHOOK_URL, payload);
  console.log('Weekly digest posted to Slack.');
}

/**
 * Extracts the skip justification from a PR body.
 * Looks for a line starting with "Skip reason:" or similar patterns.
 *
 * @param body - The PR body text.
 */
function extractSkipReason(body: string): string {
  const patterns = [
    /skip[\s-]*reason\s*:\s*(.+)/iu,
    /justification\s*:\s*(.+)/iu,
    /benchmark[\s-]*skip\s*:\s*(.+)/iu,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match?.[1]) {
      return match[1].trim().slice(0, 200);
    }
  }
  return 'no reason provided';
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
