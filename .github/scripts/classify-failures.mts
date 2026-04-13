/**
 * classify-failures.mts
 *
 * REVIEWER FOCUS: The classification logic and retry decision tree are the
 * most important things to verify. See retry-config.jsonc for the pattern
 * definitions that drive classification.
 *
 * Analyzes failed jobs in a GitHub Actions workflow run and classifies each
 * failure (jobRetryable) based on job name patterns and transient error
 * detection. Derives an overall is-retryable decision from individual results.
 *
 * Uses the `gh` CLI for GitHub API calls — no workspace dependencies required.
 * The workflow installs @sentry/node separately for optional logging.
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
 * Environment variables (set by the workflow in CI):
 *   GITHUB_OUTPUT            — Path to GitHub Actions output file
 *   GITHUB_STEP_SUMMARY      — Path to GitHub Actions step summary file
 *   HEAD_SHA                 — Commit SHA of the triggering run
 *   HEAD_BRANCH              — Branch name of the triggering run
 *   PR_NUMBER_FROM_EVENT      — PR number (from workflow_run.pull_requests[0];
 *                               empty for merge_group/push events)
 *   RUN_ATTEMPT              — Attempt number of the triggering run
 *   VERSION                  — Extension version (from package.json via curl)
 *   WORKFLOW_EVENT           — Triggering event type (e.g. merge_group, push)
 *   WORKFLOW_CONCLUSION      — Conclusion of the triggering run (e.g. failure,
 *                               cancelled); used for cancelled-run early exit
 *   CI                       — Enables Check Run creation when 'true'
 *   SENTRY_DSN_PERFORMANCE   — Sentry DSN; enables structured log delivery
 *   GITHUB_RUN_ID            — Run ID of the triage workflow (for Sentry link)
 *
 * Outputs (to $GITHUB_OUTPUT):
 *   is-retryable=true|false    — whether all failures are retryable
 *   has-retry-label=true|false — whether the originating PR has retry-ci
 *   will-retry=true|false      — is-retryable AND has-retry-label AND under attempt limit
 *   pr-number=<N>|""           — originating PR number (empty for push)
 *
 * Also writes a markdown report to $GITHUB_STEP_SUMMARY and optionally:
 *   - Creates a "Triage and Retry System" Check Run (when CI=true)
 *   - Sends a structured log to Sentry (when SENTRY_DSN_PERFORMANCE is set)
 */

import { readFileSync, appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { getGitHubToken } from './shared/github-token.mts';
import { ghApi } from './shared/gh-api.mts';

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

type Category = 'alwaysRetryable' | 'retryableOnTransientError' | 'optional';

interface JobClassification {
  jobName: string;
  jobId: number;
  category: Category;
  jobRetryable: boolean;
  reason: string;
  errorSnippet?: string;
  unmatched?: boolean;
}

interface CategoryConfig {
  patterns: string[];
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
const ATTEMPT = flags.attempt || process.env.RUN_ATTEMPT || '';
const WORKFLOW_EVENT = process.env.WORKFLOW_EVENT ?? '';
const HEAD_BRANCH = process.env.HEAD_BRANCH ?? '';
const PR_NUMBER_FROM_EVENT = process.env.PR_NUMBER_FROM_EVENT ?? '';
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT ?? '';
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY ?? '';
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID ?? '';

if (!MAIN_RUN_ID) {
  console.error(
    'No run ID provided. Pass it as the first argument or set MAIN_RUN_ID.',
  );
  process.exit(1);
}

// Maximum number of workflow run attempts before retries are disabled.
// Attempts are 1-indexed: after attempt MAX_ATTEMPTS, no further retries.
// This must stay in sync with the guard in ci-status-gate.yml.
const MAX_ATTEMPTS = 4;

const [owner, repo] = REPO.split('/');
const repoApi = `/repos/${owner}/${repo}`;
const SENTRY_DSN = process.env.SENTRY_DSN_PERFORMANCE ?? '';

// ---------------------------------------------------------------------------
// Sentry helper
// ---------------------------------------------------------------------------

/**
 * Dynamically load and initialize @sentry/node. Returns the Sentry namespace
 * on success, or null if the SDK isn't installed or the DSN is missing.
 *
 * Uses CJS require — ESM import('@sentry/node') breaks on some workspace
 * installs due to missing ESM export paths.
 */
function initSentry(): typeof import('@sentry/node') | null {
  if (!SENTRY_DSN) return null;
  try {
    const require = createRequire(import.meta.url);
    const Sentry = require('@sentry/node') as typeof import('@sentry/node');
    let version = process.env.VERSION ?? '';
    if (!version) {
      try {
        const pkgPath = join(scriptDir, '..', '..', 'package.json');
        version = (
          JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
        ).version;
      } catch {
        version = 'unknown';
      }
    }
    Sentry.init({
      dsn: SENTRY_DSN,
      enableLogs: true,
      release: `metamask-extension@${version}`,
    } as Parameters<typeof Sentry.init>[0]);
    return Sentry;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
      console.warn('Sentry skipped: @sentry/node not available');
    } else {
      console.warn('Failed to initialize Sentry:', err);
    }
    return null;
  }
}

/** Flush Sentry and log outcome. */
async function flushSentry(
  sentry: typeof import('@sentry/node'),
  label: string,
): Promise<void> {
  try {
    const flushed = await sentry.flush(5000);
    if (flushed) {
      console.log(`Sent ${label} to Sentry`);
    } else {
      console.warn('Sentry flush timed out');
    }
  } catch (err) {
    console.warn(`Sentry flush failed (${label}):`, err);
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * Strip full-line // comments and trailing commas from JSONC for JSON.parse().
 *
 * Limitations (acceptable for our config file):
 *   - Does NOT handle // inside string values (no URLs in values).
 *   - Trailing-comma regex operates on full text, so ,] or ,} inside a
 *     string value would be corrupted. No current patterns contain these.
 */
function stripJsonComments(jsonc: string): string {
  return jsonc
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/,\s*([\]}])/g, '$1');
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const configPath = join(scriptDir, '..', 'rules', 'retry-config.jsonc');
const config: RetryConfig = JSON.parse(
  stripJsonComments(readFileSync(configPath, 'utf8')),
);

const categoryOrder: Category[] = [
  'alwaysRetryable',
  'retryableOnTransientError',
  'optional',
];

const compiledPatterns = Object.fromEntries(
  categoryOrder.map((cat) => [
    cat,
    config.jobClassification[cat].patterns.map((p) => new RegExp(p, 'i')),
  ]),
) as Record<Category, RegExp[]>;
const transientErrorRegexes = config.transientErrorPatterns.map(
  (p) => new RegExp(p, 'i'),
);

const blockerRegexes = config.blockerPatterns.map((p) => new RegExp(p, 'i'));

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

// Set GH_TOKEN so the shared ghApi helper authenticates all calls.
process.env.GH_TOKEN = GITHUB_TOKEN;

let _headShaCache: string | undefined;
function getRunHeadSha(): string {
  if (_headShaCache !== undefined) return _headShaCache;
  if (process.env.HEAD_SHA) {
    _headShaCache = process.env.HEAD_SHA;
  } else {
    try {
      const run = JSON.parse(ghApi(`${repoApi}/actions/runs/${MAIN_RUN_ID}`));
      _headShaCache = (run.head_sha as string) || '';
    } catch (err) {
      console.warn(`Failed to fetch head_sha for run ${MAIN_RUN_ID}:`, err);
      _headShaCache = '';
    }
  }
  return _headShaCache;
}

function getFailedJobs(): Job[] {
  // The attempt-specific endpoint is scoped to a single attempt.
  // The default endpoint needs filter=latest to avoid returning jobs
  // from all previous attempts of re-run workflows.
  const jobsPath = ATTEMPT
    ? `${repoApi}/actions/runs/${MAIN_RUN_ID}/attempts/${ATTEMPT}/jobs?per_page=100`
    : `${repoApi}/actions/runs/${MAIN_RUN_ID}/jobs?per_page=100&filter=latest`;
  // --jq '.jobs[]' emits each job as a separate JSON object on its own
  // line.  With --paginate, gh applies the jq filter per page and
  // concatenates the output — using '.jobs[]' (not '.jobs') avoids the
  // broken concatenated-arrays problem that '.jobs' would cause across
  // multiple pages.
  const raw = ghApi(jobsPath, { paginate: true, jq: '.jobs[]' });
  const jobs: Job[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      jobs.push(JSON.parse(trimmed) as Job);
    } catch {
      console.warn(`Skipping malformed job JSON: ${trimmed.slice(0, 120)}`);
    }
  }
  return jobs.filter((j) => j.conclusion === 'failure');
}

function getAnnotations(jobId: number): Annotation[] {
  try {
    return JSON.parse(
      ghApi(`${repoApi}/check-runs/${jobId}/annotations`),
    ) as Annotation[];
  } catch {
    return [];
  }
}

const LOG_TAIL_LINES = 500;

function getJobLogs(jobId: number): string {
  try {
    const full = ghApi(`${repoApi}/actions/jobs/${jobId}/logs`);
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

function matchCategory(jobName: string): {
  category: Category;
  unmatched: boolean;
} {
  for (const cat of categoryOrder) {
    for (const re of compiledPatterns[cat]) {
      if (re.test(jobName)) return { category: cat, unmatched: false };
    }
  }
  return { category: config.defaults.unmatchedCategory, unmatched: true };
}

function findTransientError(text: string): string | undefined {
  for (const re of transientErrorRegexes) {
    const match = re.exec(text);
    if (match) return match[0];
  }
  return undefined;
}

function classifyJob(job: Job): JobClassification {
  const jobName = job.name;
  const jobId = job.id;
  const { category, unmatched } = matchCategory(jobName);

  if (unmatched) {
    console.warn(
      `  ⚠️  "${jobName}" did not match any pattern — using default category '${category}'`,
    );
  }

  if (category === 'alwaysRetryable') {
    return {
      jobName,
      jobId,
      category,
      jobRetryable: true,
      reason: 'Job is in the always-retryable category',
      unmatched,
    };
  }

  if (category === 'optional') {
    return {
      jobName,
      jobId,
      category,
      jobRetryable: false,
      reason: 'Optional job — no retry needed',
      unmatched,
    };
  }

  // retryableOnTransientError: check annotations, then logs
  const annotations = getAnnotations(jobId);
  const annotationText = annotations
    .map((a) => `${a.message ?? ''} ${a.title ?? ''}`)
    .join('\n');

  let transientMatch = findTransientError(annotationText);
  if (transientMatch) {
    return {
      jobName,
      jobId,
      category,
      jobRetryable: true,
      reason: `Transient error in annotations: ${transientMatch}`,
      errorSnippet: transientMatch,
      unmatched,
    };
  }

  // Fall back to log download
  console.log(`  Downloading logs for ${jobName} (${jobId})...`);
  const logs = getJobLogs(jobId);
  if (logs) {
    transientMatch = findTransientError(logs);
    if (transientMatch) {
      return {
        jobName,
        jobId,
        category,
        jobRetryable: true,
        reason: `Transient error in logs: ${transientMatch}`,
        errorSnippet: transientMatch,
        unmatched,
      };
    }
  }

  // No transient pattern matched. Capture the first annotation message or
  // the last few log lines so the dashboard can surface what the actual
  // error was — useful for identifying new patterns to add.
  // Skip the generic "Process completed with exit code N" annotation —
  // it appears on every failed job and provides no diagnostic value.
  const firstAnnotation = annotations.find(
    (a) =>
      a.message?.trim() &&
      !/^Process completed with exit code \d+/.test(a.message.trim()),
  );
  const fallbackSnippet = firstAnnotation
    ? firstAnnotation.message!.trim().slice(0, 200)
    : logs
      ? logs.trim().split('\n').slice(-3).join(' | ').slice(0, 200)
      : undefined;

  return {
    jobName,
    jobId,
    category,
    jobRetryable: false,
    reason: 'No transient error pattern detected',
    errorSnippet: fallbackSnippet,
    unmatched,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const WORKFLOW_CONCLUSION = process.env.WORKFLOW_CONCLUSION ?? '';

// ---------------------------------------------------------------------------
// Cancelled-run early exit
// ---------------------------------------------------------------------------
// When a retried run is cancelled before completing (e.g. preempted by a new
// merge-queue entry), emit a lightweight Sentry event so the retry success
// rate widget can count it as "did not resolve". No classification is needed.
if (WORKFLOW_CONCLUSION === 'cancelled' && Number(ATTEMPT) > 1) {
  console.log(
    `Run ${MAIN_RUN_ID} was cancelled on attempt ${ATTEMPT} — emitting cancelled event.`,
  );

  // If ci-status-gate deferred the "All jobs pass" commit status on an
  // earlier attempt (merge_group + retry-ci), it's still pending. Post a
  // failure status so the merge queue can eject instead of stalling.
  // Harmless if the queue already moved past this SHA (preemption).
  if (WORKFLOW_EVENT === 'merge_group') {
    const headSha = getRunHeadSha();
    try {
      ghApi(`${repoApi}/statuses/${headSha}`, {
        method: 'POST',
        body: {
          state: 'failure',
          context: 'All jobs pass',
          description: `Retry attempt ${ATTEMPT} was cancelled`,
        },
      });
      console.log(`Posted deferred failure commit status on ${headSha}`);
    } catch (err) {
      console.warn('Failed to post deferred failure commit status:', err);
    }
  }

  if (GITHUB_OUTPUT) {
    appendFileSync(
      GITHUB_OUTPUT,
      'is-retryable=false\nhas-retry-label=false\nwill-retry=false\npr-number=\n',
    );
  }

  const Sentry = initSentry();
  if (Sentry) {
    const branch = resolveTargetBranch();
    const prNum = resolvePrNumber();
    Sentry.logger.info('Triage and Retry System: cancelled', {
      'ci.targetBranch': branch,
      'ci.retry.date': new Date().toISOString().slice(0, 10),
      'ci.retry.decision': 'cancelled',
      'ci.retry.runId': MAIN_RUN_ID,
      'ci.retry.attempt': ATTEMPT || 'unknown',
      'ci.retry.event': WORKFLOW_EVENT || '',
      'ci.prNumber': prNum || 'none',
    });

    await flushSentry(Sentry, 'cancelled event');
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Manual-dequeue early exit
// ---------------------------------------------------------------------------
// When a user manually removes a PR from the merge queue, GitHub cancels
// the merge_group run and the workflow concludes as 'failure' (because
// get-requirements fails with "not in the merge queue"). There's nothing
// to triage — the user intentionally abandoned this queue entry.
//
// Detection: the PR timeline's `removed_from_merge_queue` event has the
// actor who did it.  If it's a real user (not github-merge-queue[bot]),
// it was a manual dequeue.
if (WORKFLOW_EVENT === 'merge_group') {
  const prNum = resolvePrNumber();
  if (prNum) {
    try {
      const raw = ghApi(`${repoApi}/issues/${prNum}/events?per_page=100`);
      const events = JSON.parse(raw) as Array<{
        event: string;
        actor: { login: string };
        created_at: string;
      }>;
      const lastRemoval = events
        .filter((e) => e.event === 'removed_from_merge_queue')
        .pop();
      const lastAdded = events
        .filter((e) => e.event === 'added_to_merge_queue')
        .pop();
      if (
        lastRemoval &&
        (!lastAdded || lastRemoval.created_at > lastAdded.created_at) &&
        lastRemoval.actor?.login !== 'github-merge-queue[bot]'
      ) {
        console.log(
          `PR #${prNum} was manually dequeued by ${lastRemoval.actor?.login} — skipping triage.`,
        );

        // The PR is already out of the queue at this point, so this status
        // is purely defensive: it ensures the orphaned merge-group commit
        // doesn't keep an "All jobs pass" check stuck in pending if
        // ci-status-gate was cancelled before it could post.
        const headSha = getRunHeadSha();
        if (headSha) {
          try {
            ghApi(`${repoApi}/statuses/${headSha}`, {
              method: 'POST',
              body: {
                state: 'failure',
                context: 'All jobs pass',
                description: `Manually dequeued by ${lastRemoval.actor?.login}`,
              },
            });
            console.log(
              `Posted failure commit status on ${headSha} to unblock merge queue.`,
            );
          } catch (err) {
            console.warn('Failed to post failure commit status:', err);
          }
        }

        if (GITHUB_OUTPUT) {
          appendFileSync(
            GITHUB_OUTPUT,
            'is-retryable=false\nhas-retry-label=false\nwill-retry=false\npr-number=\n',
          );
        }
        process.exit(0);
      }
    } catch (err) {
      console.warn('Could not check merge queue removal events:', err);
      // Fall through to normal classification
    }
  }
}

console.log(`Classifying failures for run ${MAIN_RUN_ID}...`);

const failedJobs = getFailedJobs();

if (failedJobs.length === 0) {
  // No jobs with conclusion === 'failure'. This happens when the run was
  // cancelled (jobs get conclusion 'cancelled', not 'failure').
  //
  // IMPORTANT: if this was a merge_group run, ci-status-gate was likely
  // skipped by the cancellation (its `if: !cancelled()` condition becomes
  // false). That means no "All jobs pass" commit status was posted. The
  // merge queue requires that status, so it will stall until the 60-minute
  // timeout unless we post a failure status here to unblock ejection.
  console.log('No failed jobs found.');

  if (WORKFLOW_EVENT === 'merge_group' && WORKFLOW_CONCLUSION === 'cancelled') {
    const headSha = getRunHeadSha();
    if (headSha) {
      try {
        ghApi(`${repoApi}/statuses/${headSha}`, {
          method: 'POST',
          body: {
            state: 'failure',
            context: 'All jobs pass',
            description:
              'Run was cancelled — posting failure to unblock merge queue',
          },
        });
        console.log(
          `Posted failure commit status on ${headSha} to unblock merge queue.`,
        );
      } catch (err) {
        console.warn('Failed to post failure commit status:', err);
      }
    }
  }

  if (GITHUB_OUTPUT) {
    appendFileSync(
      GITHUB_OUTPUT,
      'is-retryable=false\nhas-retry-label=false\nwill-retry=false\npr-number=\n',
    );
  }
  process.exit(0);
}

console.log(`Found ${failedJobs.length} failed job(s):\n`);

// Partition into blockers and non-blockers. If any blocker fails
// non-transiently, stop early and tag all remaining jobs as cascade.
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
    `    → ${result.jobRetryable ? '✅ retryable' : '❌ non-retryable'}: ${result.reason}`,
  );
  if (!result.jobRetryable) {
    blockedBy = job.name;
    // Tag remaining unclassified blockers as cascade
    const remaining = blockerJobs.slice(blockerJobs.indexOf(job) + 1);
    tagCascade(remaining, false, `Cascade — blocked by ${blockedBy}`);
    break;
  }
}

function tagCascade(jobs: Job[], jobRetryable: boolean, reason: string): void {
  for (const job of jobs) {
    const { category, unmatched } = matchCategory(job.name);
    classifications.push({
      jobName: job.name,
      jobId: job.id,
      category,
      jobRetryable,
      reason,
      unmatched,
    });
  }
}

if (blockedBy) {
  console.log(
    `\n  ⛔ Blocker "${blockedBy}" failed non-transiently. Skipping remaining jobs.\n`,
  );
  tagCascade(otherJobs, false, `Cascade — blocked by ${blockedBy}`);
} else if (blockerJobs.length > 0) {
  const blockerNames = blockerJobs.map((j) => j.name).join(', ');
  console.log(
    `\n  ♻️  Blocker(s) retryable — tagging ${otherJobs.length} downstream job(s) as cascade.\n`,
  );
  tagCascade(
    otherJobs,
    true,
    `Cascade — will resolve when blocker retries (${blockerNames})`,
  );
} else {
  // No blocker failures — classify each job individually.
  for (const job of otherJobs) {
    console.log(`  Classifying: ${job.name}`);
    const result = classifyJob(job);
    classifications.push(result);
    console.log(
      `    → ${result.jobRetryable ? '✅ retryable' : '❌ non-retryable'}: ${result.reason}`,
    );
  }
}

// Optional failures don't influence the retry decision.
const nonOptional = classifications.filter((c) => c.category !== 'optional');
const isRetryable =
  nonOptional.length > 0 && nonOptional.every((c) => c.jobRetryable);
console.log(`\nDecision: is-retryable=${isRetryable}`);

// ---------------------------------------------------------------------------
// Resolve originating PR and check for retry-ci label
// ---------------------------------------------------------------------------

function resolvePrNumber(): string {
  if (WORKFLOW_EVENT === 'pull_request' && PR_NUMBER_FROM_EVENT) {
    return PR_NUMBER_FROM_EVENT;
  }
  const match = HEAD_BRANCH.match(/gh-readonly-queue\/[^/]+\/pr-(\d+)-/);
  if (WORKFLOW_EVENT === 'merge_group' && match) {
    return match[1];
  }
  return '';
}

/**
 * Resolves the target branch name from HEAD_BRANCH.
 *
 * For merge_group events HEAD_BRANCH is the temporary merge queue branch,
 * e.g. `gh-readonly-queue/main/pr-12345-abc123`. Extract the target branch
 * (`main`) so the dashboard field shows something meaningful.
 *
 * For push and pull_request events HEAD_BRANCH is already the real name.
 */
function resolveTargetBranch(): string {
  const match = HEAD_BRANCH.match(/^gh-readonly-queue\/([^/]+)\//);
  if (WORKFLOW_EVENT === 'merge_group' && match) {
    return match[1];
  }
  return HEAD_BRANCH;
}

function checkRetryLabel(prNum: string): boolean {
  if (!prNum) return false;
  try {
    const labels = ghApi(`${repoApi}/issues/${prNum}/labels`);
    return (JSON.parse(labels) as Array<{ name: string }>).some(
      (l) => l.name === 'retry-ci',
    );
  } catch {
    console.warn(`Could not check labels on PR #${prNum}`);
    return false;
  }
}

const prNumber = resolvePrNumber();
const targetBranch = resolveTargetBranch();
const hasRetryLabel = checkRetryLabel(prNumber);
const atMaxAttempts = Number(ATTEMPT) >= MAX_ATTEMPTS;
const willRetry = isRetryable && hasRetryLabel && !atMaxAttempts;
const hasPR = Boolean(prNumber);

// The retry decision depends on three independent facts:
//
//   isRetryable    — did classification determine all failures are retryable?
//   hasPR          — is there an originating PR? (false for push events)
//   hasRetryLabel  — does that PR have the `retry-ci` label?
//
// A retry only happens when ALL THREE are true (will-retry). The other
// combinations produce different reports and Sentry attributes so we can
// distinguish "retryable but nobody asked for a retry" from "someone asked
// but the failures aren't retryable."
//
// Note: hasRetryLabel implies hasPR (can't have a label without a PR),
// so the retryable=*,hasPR=false,hasLabel=true combination never occurs.
//
// resolveDecision() returns:
//   key   — Sentry attribute value for ci.retry.decision
//   label — human-readable line in the step summary / check run report
function resolveDecision(
  retryable: boolean,
  hasPr: boolean,
  hasLabel: boolean,
  maxAttempts: boolean,
  pr: string,
): { key: string; label: string } {
  if (retryable) {
    if (hasPr && hasLabel && !maxAttempts)
      return {
        key: 'will-retry',
        label: '♻️ Will retry (retry-ci label present)',
      };
    if (hasPr && hasLabel && maxAttempts)
      return {
        key: 'max-attempts-reached',
        label: `🛑 Retryable with retry-ci label, but attempt ${ATTEMPT} reached the limit of ${MAX_ATTEMPTS}`,
      };
    if (hasPr)
      return {
        key: 'retryable-no-label',
        label: `⏸️ Retryable, but no retry-ci label on PR #${pr}`,
      };
    return {
      key: 'retryable-no-pr',
      label: '🔇 Retryable, but no originating PR (observation only)',
    };
  }
  if (hasPr && hasLabel)
    return {
      key: 'not-retryable-has-label',
      label: '⛔ Has retry-ci label but non-retryable failures',
    };
  if (hasPr)
    return {
      key: 'not-retryable-no-label',
      label: `❌ Non-retryable (PR #${pr}, no retry-ci label)`,
    };
  return {
    key: 'not-retryable-no-pr',
    label: '❌ Non-retryable, no originating PR (observation only)',
  };
}
const { key: decision, label: decisionLabel } = resolveDecision(
  isRetryable,
  hasPR,
  hasRetryLabel,
  atMaxAttempts,
  prNumber,
);

if (atMaxAttempts && hasRetryLabel && isRetryable) {
  console.log(
    `PR #${prNumber}: retry-ci label present but attempt ${ATTEMPT} >= ${MAX_ATTEMPTS} — will not retry`,
  );
} else {
  console.log(
    prNumber
      ? `PR #${prNumber}: retry-ci label ${hasRetryLabel ? 'present' : 'absent'} → will-retry=${willRetry}`
      : `No originating PR for event '${WORKFLOW_EVENT}' → will-retry=false`,
  );
}

// ---------------------------------------------------------------------------
// Post deferred failure commit status (merge queue only)
//
// ci-status-gate.yml defers the "All jobs pass" commit status when it
// sees retry-ci on attempts below the limit (< MAX_ATTEMPTS), giving
// triage time to retry. If we decide NOT to retry (non-retryable
// failures, or max attempts reached), we must post the failure status
// here to unblock the merge queue for ejection.
//
// The merge queue requires two checks (ruleset or classic branch protection):
//   Rule 1 — Merge queue > ALLGREEN (monitors check suites directly)
//   Rule 2 — Status checks > "All jobs pass" (monitors commit status)
// Without this fallback post, Rule 2 stays pending forever and the queue
// can't eject the PR.
// ---------------------------------------------------------------------------

// The gate defers when: merge_group + failure + retry-ci + attempt < MAX_ATTEMPTS.
// We can't re-check hasRetryLabel here because the API call might fail (rate
// limit, transient outage), and if it does, the deferred status would never
// post — leaving the queue stuck. Instead, post on any merge_group where we
// won't retry. If the gate didn't actually defer (no label), this posts a
// redundant failure status — harmless, since ci-status-gate already posted one.
if (WORKFLOW_EVENT === 'merge_group' && !willRetry) {
  const headSha = getRunHeadSha();
  const description = atMaxAttempts
    ? `Retry limit reached (attempt ${ATTEMPT} of ${MAX_ATTEMPTS})`
    : isRetryable
      ? 'Retryable failures, but no retry-ci label'
      : 'Non-retryable failures detected';
  try {
    ghApi(`${repoApi}/statuses/${headSha}`, {
      method: 'POST',
      body: {
        state: 'failure',
        context: 'All jobs pass',
        description,
      },
    });
    console.log(`Posted deferred failure commit status on ${headSha}`);
  } catch (err) {
    console.warn('Failed to post deferred failure commit status:', err);
  }
}

// ---------------------------------------------------------------------------
// Write GITHUB_OUTPUT
// ---------------------------------------------------------------------------

if (GITHUB_OUTPUT) {
  appendFileSync(
    GITHUB_OUTPUT,
    [
      `is-retryable=${isRetryable}`,
      `has-retry-label=${hasRetryLabel}`,
      `will-retry=${willRetry}`,
      `pr-number=${prNumber}`,
    ].join('\n') + '\n',
  );
}

// ---------------------------------------------------------------------------
// Write GITHUB_STEP_SUMMARY (markdown report)
// ---------------------------------------------------------------------------

const mainRunUrl = `https://github.com/${owner}/${repo}/actions/runs/${MAIN_RUN_ID}`;
const triageRunUrl = `https://github.com/${owner}/${repo}/actions/runs/${GITHUB_RUN_ID}`;

const reportLines = [
  `## Triage and Retry System`,
  ``,
  `**Run:** [${MAIN_RUN_ID}](${mainRunUrl})${ATTEMPT ? ` (attempt ${ATTEMPT})` : ''}`,
  `**Classification:** ${isRetryable ? '✅ All failures retryable' : '❌ Non-retryable failures detected'}`,
  `**Retry:** ${decisionLabel}`,
  `**Failed jobs:** ${failedJobs.length}`,
  ``,
  `| Job | Category | Job Retryable | Reason |`,
  `|-----|----------|---------------|--------|`,
  ...classifications.map(
    (c) =>
      `| ${c.jobName} | ${c.unmatched ? '⚠️ ' : ''}${c.category} | ${c.jobRetryable ? '✅' : '❌'} | ${c.reason} |`,
  ),
];

const unmatchedJobs = classifications.filter((c) => c.unmatched);
if (unmatchedJobs.length > 0) {
  reportLines.push(
    ``,
    `> ⚠️ **${unmatchedJobs.length} job(s) did not match any pattern** in retry-config.jsonc and used the default category \`${config.defaults.unmatchedCategory}\`:`,
    ...unmatchedJobs.map((c) => `> - ${c.jobName}`),
  );
}

if (atMaxAttempts && isRetryable && hasRetryLabel) {
  reportLines.push(
    ``,
    `> 🛑 **Retry limit reached** — attempt ${ATTEMPT} of ${MAX_ATTEMPTS}. The failures look retryable, but no more automatic retries will be attempted.`,
  );
}

const report = reportLines.join('\n');

if (GITHUB_STEP_SUMMARY) {
  appendFileSync(GITHUB_STEP_SUMMARY, report + '\n');
}

// Also print to console for non-GHA usage
console.log('\n' + report);

// ---------------------------------------------------------------------------
// Create Check Run on the triggering commit
//
// TODO: This is untestable in a fork repo, and we won't really know if this works
// until we merge it and see it run in the real repo.
// ---------------------------------------------------------------------------

if (process.env.CI === 'true' && REPO === 'MetaMask/metamask-extension') {
  try {
    const headSha = getRunHeadSha();
    const checkTitle = isRetryable
      ? 'All failures are retryable'
      : 'Non-retryable failures detected';

    ghApi(`${repoApi}/check-runs`, {
      method: 'POST',
      body: {
        name: 'Triage and Retry System',
        head_sha: headSha,
        status: 'completed',
        conclusion: isRetryable ? 'neutral' : 'failure',
        output: {
          title: checkTitle,
          summary: report,
        },
      },
    });
    console.log(`Created 'Triage and Retry System' check on ${headSha}`);
  } catch (err) {
    // Non-fatal: the check is informational. Log and continue.
    console.warn('Failed to create check run annotation:', err);
  }
}

// ---------------------------------------------------------------------------
// Send structured log to Sentry
// ---------------------------------------------------------------------------

const Sentry = initSentry();
if (Sentry) {
  // Exclude optional jobs (e.g. ci-status-gate) from counts and ratios —
  // they don't influence the retry decision and inflate the numbers.
  const jobRetryableCount = nonOptional.filter((c) => c.jobRetryable).length;
  const jobNonRetryableCount = nonOptional.length - jobRetryableCount;
  const retryableRatio =
    nonOptional.length > 0
      ? Math.round((jobRetryableCount / nonOptional.length) * 10000) / 10000
      : 0;
  const nonRetryableRatio =
    nonOptional.length > 0
      ? Math.round((jobNonRetryableCount / nonOptional.length) * 10000) / 10000
      : 0;

  const drilldownQuery = `message:"Triage and Retry System Job" ci.retry.runId:${MAIN_RUN_ID}`;
  const sentryBaseUrl = (
    process.env.SENTRY_BASE_URL || 'https://metamask.sentry.io'
  ).replace(/\/+$/, '');
  const drilldownBase = `${sentryBaseUrl}/explore/logs/`;
  const drilldownParams = new URLSearchParams({
    logsQuery: drilldownQuery,
    logsSortBys: '-timestamp',
    statsPeriod: '14d',
  });
  drilldownParams.append('logsFields', 'timestamp');
  drilldownParams.append('logsFields', 'message');
  const jobDrilldownUrl = `${drilldownBase}?${drilldownParams.toString()}`;

  const parentTriageParams = new URLSearchParams({
    logsQuery: `message:"Triage and Retry System:" ci.retry.runId:${MAIN_RUN_ID}`,
    statsPeriod: '14d',
  });
  const parentTriageLink = `${drilldownBase}?${parentTriageParams.toString()}`;

  Sentry.logger.info(`Triage and Retry System: ${decision}`, {
    'ci.targetBranch': targetBranch || '',
    'ci.commitHash': getRunHeadSha(),
    'ci.prNumber': prNumber || 'none',
    'ci.retry.date': new Date().toISOString().slice(0, 10),
    'ci.retry.decision': decision,
    'ci.retry.runId': MAIN_RUN_ID,
    'ci.retry.attempt': ATTEMPT || 'unknown',
    'ci.retry.event': WORKFLOW_EVENT || '',
    'ci.retry.failedJobCount': String(nonOptional.length),
    'ci.retry.jobRetryableCount': String(jobRetryableCount),
    'ci.retry.jobNonRetryableCount': String(jobNonRetryableCount),
    'ci.retry.retryableRatio': String(retryableRatio),
    'ci.retry.nonRetryableRatio': String(nonRetryableRatio),
    'ci.retry.unmatchedJobCount': String(unmatchedJobs.length),
    'ci.retry.mainRunUrl': mainRunUrl,
    'ci.retry.triageRunUrl': triageRunUrl,
    'ci.retry.jobDrilldownUrl': jobDrilldownUrl,
    'ci.retry.report': report,
    ...(blockedBy ? { 'ci.blockedBy': blockedBy } : {}),
  });

  const MAX_PER_JOB_EVENTS = 200;
  const jobEvents = classifications.slice(0, MAX_PER_JOB_EVENTS);

  for (const job of jobEvents) {
    Sentry.logger.info('Triage and Retry System Job', {
      'ci.retry.runId': MAIN_RUN_ID,
      'ci.retry.date': new Date().toISOString().slice(0, 10),
      'ci.retry.decision': decision,
      'ci.retry.attempt': ATTEMPT || 'unknown',
      'ci.retry.event': WORKFLOW_EVENT || '',
      'ci.retry.parentTriageLink': parentTriageLink,
      'ci.job.id': String(job.jobId),
      'ci.job.name': job.jobName,
      'ci.job.category': job.category,
      'ci.job.retryable': String(job.jobRetryable),
      'ci.job.reason': job.reason,
      ...(job.errorSnippet ? { 'ci.job.errorSnippet': job.errorSnippet } : {}),
      ...(job.unmatched ? { 'ci.job.unmatched': true } : {}),
    });
  }

  if (classifications.length > MAX_PER_JOB_EVENTS) {
    Sentry.logger.info('Triage and Retry System Job events truncated', {
      'ci.retry.runId': MAIN_RUN_ID,
      'ci.retry.jobEventLimit': String(MAX_PER_JOB_EVENTS),
      'ci.retry.jobEventCount': String(classifications.length),
    });
  }

  await flushSentry(Sentry, 'classification log');
}
