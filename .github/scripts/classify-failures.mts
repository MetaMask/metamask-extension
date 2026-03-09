/**
 * classify-failures.mts
 *
 * Analyzes failed jobs in a GitHub Actions workflow run and classifies each
 * failure as retryable or non-retryable based on job name patterns and
 * transient error detection.
 *
 * Uses only the `gh` CLI for API calls — no npm dependencies required.
 * This lets the workflow use a sparse checkout without `yarn install`.
 *
 * Usage (CLI):
 *   node .github/scripts/classify-failures.mts <run-id> [--repo owner/repo]
 *
 * Usage (GitHub Actions — via env vars):
 *   GITHUB_TOKEN=... MAIN_RUN_ID=... REPO=... node .github/scripts/classify-failures.mts
 *
 * CLI arguments take precedence over environment variables.
 * GITHUB_TOKEN (or GH_TOKEN) is always read from the environment.
 *
 * Optional environment variables:
 *   GITHUB_OUTPUT       — Path to GitHub Actions output file
 *   GITHUB_STEP_SUMMARY — Path to GitHub Actions step summary file
 *
 * Outputs (to $GITHUB_OUTPUT):
 *   should-retry=true|false
 *
 * Also writes a markdown report to $GITHUB_STEP_SUMMARY.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { getGitHubToken } from './github-token.mts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Job {
  id: number;
  name: string;
  conclusion: string | null;
}

interface Annotation {
  message?: string;
  title?: string;
}

type Category =
  | 'alwaysRetryable'
  | 'retryableOnTransientError'
  | 'usuallyNotFlaky'
  | 'optional';

interface JobClassification {
  jobName: string;
  jobId: number;
  category: Category;
  retryable: boolean;
  reason: string;
  errorSnippet?: string;
}

interface CategoryConfig {
  patterns: string[];
  transientErrorPatterns?: string[];
}

interface RetryConfig {
  jobClassification: Record<Category, CategoryConfig>;
  blockerPatterns: string[];
  transientErrorPatterns: string[];
  defaults: { unmatchedCategory: Category };
}

// ---------------------------------------------------------------------------
// CLI + Environment
// ---------------------------------------------------------------------------

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    repo: { type: 'string', short: 'r' },
    attempt: { type: 'string', short: 'a' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (flags.help) {
  console.log(
    `Usage: node classify-failures.mts <run-id> [--repo owner/repo] [--attempt N]\n\n` +
      `  <run-id>    Workflow run ID (or set MAIN_RUN_ID env var)\n` +
      `  --repo      Repository in owner/repo format (default: REPO env or MetaMask/metamask-extension)\n` +
      `  --attempt   Run attempt number (default: latest)\n` +
      `\nGITHUB_TOKEN or GH_TOKEN must be set in the environment.`,
  );
  process.exit(0);
}

const GITHUB_TOKEN = getGitHubToken();
const MAIN_RUN_ID = positionals[0] || process.env.MAIN_RUN_ID || '';
const REPO = flags.repo || process.env.REPO || 'MetaMask/metamask-extension';
const ATTEMPT = flags.attempt ?? '';
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT ?? '';
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY ?? '';

if (!MAIN_RUN_ID) {
  console.error(
    'No run ID provided. Pass it as the first argument or set MAIN_RUN_ID.',
  );
  process.exit(1);
}

const [owner, repo] = REPO.split('/');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const scriptDir = dirname(fileURLToPath(import.meta.url));
const configPath = join(scriptDir, '..', 'retry-config.json');
const config: RetryConfig = JSON.parse(readFileSync(configPath, 'utf8'));

const compiledPatterns: Record<Category, RegExp[]> = {
  alwaysRetryable: config.jobClassification.alwaysRetryable.patterns.map(
    (p) => new RegExp(p, 'i'),
  ),
  retryableOnTransientError:
    config.jobClassification.retryableOnTransientError.patterns.map(
      (p) => new RegExp(p, 'i'),
    ),
  usuallyNotFlaky: config.jobClassification.usuallyNotFlaky.patterns.map(
    (p) => new RegExp(p, 'i'),
  ),
  optional: config.jobClassification.optional.patterns.map(
    (p) => new RegExp(p, 'i'),
  ),
};
const transientErrorRegexes = config.transientErrorPatterns.map(
  (p) => new RegExp(p, 'i'),
);

const categoryTransientRegexes: Partial<Record<Category, RegExp[]>> = {};
for (const cat of Object.keys(config.jobClassification) as Category[]) {
  const extra = config.jobClassification[cat].transientErrorPatterns;
  if (extra?.length) {
    categoryTransientRegexes[cat] = extra.map((p) => new RegExp(p, 'i'));
  }
}

const blockerRegexes = config.blockerPatterns.map((p) => new RegExp(p, 'i'));

const categoryOrder: Category[] = [
  'alwaysRetryable',
  'retryableOnTransientError',
  'usuallyNotFlaky',
  'optional',
];

// ---------------------------------------------------------------------------
// GitHub API helpers (gh CLI — no npm dependencies)
// ---------------------------------------------------------------------------

const ghEnv = { ...process.env, GH_TOKEN: GITHUB_TOKEN };

/** Call a GitHub REST API endpoint via `gh api`. Returns the raw response. */
function ghApi(path: string): string {
  return execFileSync('gh', ['api', path], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    env: ghEnv,
  });
}

function getFailedJobs(): Job[] {
  const jobsPath = ATTEMPT
    ? `/repos/${owner}/${repo}/actions/runs/${MAIN_RUN_ID}/attempts/${ATTEMPT}/jobs?per_page=100`
    : `/repos/${owner}/${repo}/actions/runs/${MAIN_RUN_ID}/jobs?per_page=100`;
  const response = JSON.parse(ghApi(jobsPath));
  return (response.jobs as Job[]).filter((j) => j.conclusion === 'failure');
}

function getAnnotations(jobId: number): Annotation[] {
  try {
    return JSON.parse(
      ghApi(`/repos/${owner}/${repo}/check-runs/${jobId}/annotations`),
    ) as Annotation[];
  } catch {
    return [];
  }
}

const LOG_TAIL_LINES = 500;

function getJobLogs(jobId: number): string {
  try {
    const full = execFileSync(
      'gh',
      ['api', `/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`],
      {
        encoding: 'utf8',
        maxBuffer: 5 * 1024 * 1024, // 5 MB cap
        env: ghEnv,
      },
    );
    // Only search the tail — error summaries appear at the end and this
    // avoids false positives from earlier benign output.
    const lines = full.split('\n');
    return lines.slice(-LOG_TAIL_LINES).join('\n');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Classification logic
// ---------------------------------------------------------------------------

function matchCategory(jobName: string): Category | 'unmatched' {
  for (const cat of categoryOrder) {
    for (const re of compiledPatterns[cat]) {
      if (re.test(jobName)) return cat;
    }
  }
  return 'unmatched';
}

function findTransientError(
  text: string,
  category?: Category,
): string | undefined {
  for (const re of transientErrorRegexes) {
    const match = re.exec(text);
    if (match) return match[0];
  }
  if (category) {
    const extras = categoryTransientRegexes[category];
    if (extras) {
      for (const re of extras) {
        const match = re.exec(text);
        if (match) return match[0];
      }
    }
  }
  return undefined;
}

function classifyJob(job: Job): JobClassification {
  const jobName = job.name;
  const jobId = job.id;
  let category: Category | 'unmatched' = matchCategory(jobName);

  // Unmatched jobs use the configured default
  if (category === 'unmatched') {
    category = config.defaults.unmatchedCategory;
  }

  if (category === 'alwaysRetryable') {
    return {
      jobName,
      jobId,
      category,
      retryable: true,
      reason: 'Job is in the always-retryable category',
    };
  }

  if (category === 'optional') {
    return {
      jobName,
      jobId,
      category,
      retryable: false,
      reason: 'Optional job — no retry needed',
    };
  }

  // retryableOnTransientError / usuallyNotFlaky: check annotations, then logs
  const annotations = getAnnotations(jobId);
  const annotationText = annotations
    .map((a) => `${a.message ?? ''} ${a.title ?? ''}`)
    .join('\n');

  let transientMatch = findTransientError(annotationText, category);
  if (transientMatch) {
    return {
      jobName,
      jobId,
      category,
      retryable: true,
      reason: `Transient error in annotations: ${transientMatch}`,
      errorSnippet: transientMatch,
    };
  }

  // Fall back to log download
  console.log(`  Downloading logs for ${jobName} (${jobId})...`);
  const logs = getJobLogs(jobId);
  if (logs) {
    transientMatch = findTransientError(logs, category);
    if (transientMatch) {
      return {
        jobName,
        jobId,
        category,
        retryable: true,
        reason: `Transient error in logs: ${transientMatch}`,
        errorSnippet: transientMatch,
      };
    }
  }

  return {
    jobName,
    jobId,
    category,
    retryable: false,
    reason: 'No transient error pattern detected',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`Classifying failures for run ${MAIN_RUN_ID}...`);

const failedJobs = getFailedJobs();

if (failedJobs.length === 0) {
  console.log('No failed jobs found.');
  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, 'should-retry=false\n');
  }
  process.exit(0);
}

console.log(`Found ${failedJobs.length} failed job(s):\n`);

// Partition into blockers and non-blockers so we can short-circuit.
const isBlocker = (name: string) => blockerRegexes.some((re) => re.test(name));
const blockerJobs = failedJobs.filter((j) => isBlocker(j.name));
const otherJobs = failedJobs.filter((j) => !isBlocker(j.name));

const classifications: JobClassification[] = [];
let blockedBy: string | undefined;

// Classify blockers first.
for (const job of blockerJobs) {
  console.log(`  Classifying (blocker): ${job.name}`);
  const result = classifyJob(job);
  classifications.push(result);
  console.log(
    `    → ${result.retryable ? '✅ retryable' : '❌ non-retryable'}: ${result.reason}`,
  );
  if (!result.retryable) {
    blockedBy = job.name;
    break; // No point checking further
  }
}

if (blockedBy) {
  // Tag remaining failed jobs as cascade failures — no log downloads needed.
  console.log(
    `\n  ⛔ Blocker "${blockedBy}" failed non-transiently. Skipping remaining jobs.\n`,
  );
  for (const job of otherJobs) {
    const category = matchCategory(job.name);
    classifications.push({
      jobName: job.name,
      jobId: job.id,
      category:
        category === 'unmatched' ? config.defaults.unmatchedCategory : category,
      retryable: false,
      reason: `Cascade — blocked by ${blockedBy}`,
    });
  }
} else if (blockerJobs.length > 0) {
  // All blockers are retryable — downstream failures are cascade and will
  // resolve on retry, so mark them retryable without downloading logs.
  const blockerNames = blockerJobs.map((j) => j.name).join(', ');
  console.log(
    `\n  ♻️  Blocker(s) retryable — tagging ${otherJobs.length} downstream job(s) as cascade.\n`,
  );
  for (const job of otherJobs) {
    const category = matchCategory(job.name);
    classifications.push({
      jobName: job.name,
      jobId: job.id,
      category:
        category === 'unmatched' ? config.defaults.unmatchedCategory : category,
      retryable: true,
      reason: `Cascade — will resolve when blocker retries (${blockerNames})`,
    });
  }
} else {
  // No blocker failures — classify each job individually.
  for (const job of otherJobs) {
    console.log(`  Classifying: ${job.name}`);
    const result = classifyJob(job);
    classifications.push(result);
    console.log(
      `    → ${result.retryable ? '✅ retryable' : '❌ non-retryable'}: ${result.reason}`,
    );
  }
}

// Optional failures don't influence the retry decision.
const nonOptional = classifications.filter((c) => c.category !== 'optional');
const shouldRetry =
  nonOptional.length > 0 && nonOptional.every((c) => c.retryable);
console.log(`\nDecision: should-retry=${shouldRetry}`);

// ---------------------------------------------------------------------------
// Write GITHUB_OUTPUT
// ---------------------------------------------------------------------------

if (GITHUB_OUTPUT) {
  appendFileSync(GITHUB_OUTPUT, `should-retry=${shouldRetry}\n`);
}

// ---------------------------------------------------------------------------
// Write GITHUB_STEP_SUMMARY (markdown report)
// ---------------------------------------------------------------------------

const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${MAIN_RUN_ID}`;

const reportLines = [
  `## Merge Queue Failure Classification`,
  ``,
  `**Run:** [${MAIN_RUN_ID}](${runUrl})`,
  `**Decision:** ${shouldRetry ? '✅ Would retry' : '❌ Would NOT retry'}`,
  `**Failed jobs:** ${failedJobs.length}`,
  ``,
  `| Job | Category | Retryable | Reason |`,
  `|-----|----------|-----------|--------|`,
  ...classifications.map(
    (c) =>
      `| ${c.jobName} | ${c.category} | ${c.retryable ? '✅' : '❌'} | ${c.reason} |`,
  ),
  ``,
  `> **Note:** Classification is experimental (report-only). Retry is gated on the \`retry-ci\` label.`,
];

const report = reportLines.join('\n');

if (GITHUB_STEP_SUMMARY) {
  appendFileSync(GITHUB_STEP_SUMMARY, report + '\n');
}

// Also print to console for non-GHA usage
console.log('\n' + report);
