/**
 * classify-failures.mts
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
 *   will-retry=true|false      — is-retryable AND has PR AND under active retry limit
 *   consume-retry-label=true|false — whether this retry should remove retry-ci
 *   retry-mode=automatic|label|none — source of the retry budget used
 *   pr-number=<N>|""           — originating PR number (empty for push)
 *
 * Also writes a markdown report to $GITHUB_STEP_SUMMARY and optionally:
 *   - Creates a "Triage and Retry System" Check Run (when CI=true)
 *   - Sends a structured log to Sentry (when SENTRY_DSN_PERFORMANCE is set)
 */

import { appendFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ghApi } from './shared/gh-api.mts';
import { getGitHubToken } from './shared/github-token.mts';
import { stripJsonComments } from './shared/json-tools.mts';
import {
  DEFAULT_RETRY_MAX_ATTEMPT,
  getRetryBudget,
  RETRY_CI_LABEL_MAX_ATTEMPT,
  type RetryBudgetDecision,
} from './shared/retry-budget.mts';
import {
  E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE,
  hasE2eQualityGateFailure,
} from './shared/e2e-quality-gate.mts';
import { partitionRetryableBlockerCascadeJobs } from './shared/failure-classification.mts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Job {
  id: number;
  name: string;
  conclusion: string | null;
}

interface Annotation {
  annotation_level?: 'notice' | 'warning' | 'failure';
  message?: string;
  title?: string;
  path?: string;
  start_line?: number;
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
  deterministic?: boolean;
}

interface CategoryConfig {
  patterns: string[];
}

interface RetryConfig {
  jobClassification: Record<Category, CategoryConfig>;
  blockerPatterns: string[];
  transientErrorPatterns: string[];
  deterministicErrorPatterns: string[];
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

// Retry limits are 1-indexed and shared with ci-status-gate.yml's merge queue
// deferral rules: default retries can create attempt 2, and retry-ci can create
// attempts 3 and 4.

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
const deterministicErrorRegexes = config.deterministicErrorPatterns.map(
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

function getAnnotations(jobId: number): {
  annotations: Annotation[];
  available: boolean;
} {
  try {
    const raw = ghApi(`${repoApi}/check-runs/${jobId}/annotations`, {
      paginate: true,
      jq: '.[]',
    });
    const annotations: Annotation[] = [];
    for (const line of raw.split('\n')) {
      if (!line) continue;
      try {
        annotations.push(JSON.parse(line) as Annotation);
      } catch {
        console.warn(`Skipping malformed annotation JSON for job ${jobId}`);
      }
    }
    return { annotations, available: true };
  } catch {
    return { annotations: [], available: false };
  }
}

const LOG_TAIL_LINES = 500;

function getJobLogs(jobId: number): string {
  try {
    // The raw job-log API can make gh reject GitHub Actions' ANSI-bearing
    // response. `gh run view` is the CLI-supported per-job log path.
    const full = execFileSync(
      'gh',
      [
        'run',
        'view',
        MAIN_RUN_ID,
        '--repo',
        REPO,
        '--log',
        '--job',
        String(jobId),
      ],
      {
        encoding: 'utf8',
        // Disable CLI color without removing runner output used below to
        // classify transient failures.
        env: { ...process.env, NO_COLOR: '1' },
        maxBuffer: 10 * 1024 * 1024,
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
    const annotationResult = getAnnotations(jobId);
    if (!annotationResult.available) {
      // E2E jobs are normally retryable, but absent annotation evidence must
      // fail closed so an unavailable API cannot bypass a terminal gate.
      return {
        jobName,
        jobId,
        category,
        jobRetryable: false,
        reason: 'Could not verify E2E quality-gate annotations',
        unmatched,
        deterministic: true,
      };
    }

    if (hasE2eQualityGateFailure(annotationResult.annotations)) {
      return {
        jobName,
        jobId,
        category,
        jobRetryable: false,
        reason: 'Changed or new E2E test failed its quality gate',
        errorSnippet: E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE,
        unmatched,
        deterministic: true,
      };
    }

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
  const { annotations } = getAnnotations(jobId);
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
  // a meaningful log line so the dashboard can surface what the actual
  // error was — useful for identifying new patterns to add.
  // Skip the generic "Process completed with exit code N" annotation —
  // it appears on every failed job and provides no diagnostic value.
  const firstAnnotation = annotations.find(
    (a) =>
      a.message?.trim() &&
      !/^Process completed with exit code \d+/.test(a.message.trim()),
  );
  let fallbackSnippet: string | undefined;
  if (firstAnnotation) {
    fallbackSnippet = firstAnnotation.message!.trim().slice(0, 200);
  } else if (logs) {
    // Scan from the bottom for a line that looks like an actual error.
    // The last few lines are often just the checkout/cleanup step —
    // the real error is usually a few lines above.
    const errorLineRe =
      /\b(?:error|ERR!|FATAL|fatal|failed|FAILED|Error:|Cannot |Unable to )/i;
    const lines = logs.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      // Strip the GHA timestamp prefix (e.g. "2026-04-09T20:48:51.437Z ")
      const stripped = line.replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/, '');
      if (
        stripped &&
        errorLineRe.test(stripped) &&
        !/Process completed with exit code \d+/.test(stripped) &&
        !/^\[command\]/.test(stripped)
      ) {
        fallbackSnippet = stripped.slice(0, 200);
        break;
      }
    }
    // Last resort: use the last 3 lines if no error-like line was found
    if (!fallbackSnippet) {
      fallbackSnippet = lines.slice(-3).join(' | ').slice(0, 200);
    }
  }

  // Check for deterministic (non-transient) failure signals.
  //
  // STRUCTURAL: If any annotation references a source file (has a real
  // path + line number), this is a compiler/linter error — deterministic
  // by nature. This catches ALL TypeScript, ESLint, and Stylelint errors
  // without needing to enumerate every possible error message.
  // Prefer "failure"-level annotations over "warning"-level ones —
  // warnings (e.g. React Hook missing dependency) don't cause the job
  // to fail and shouldn't be reported as the root cause.
  const isSourceAnnotation = (a: (typeof annotations)[number]) =>
    a.path &&
    a.path !== '.github' &&
    a.start_line != null &&
    a.start_line > 0 &&
    a.message?.trim() &&
    !/^Process completed with exit code \d+/.test(a.message.trim());
  const sourceFileAnnotation =
    annotations.find(
      (a) => isSourceAnnotation(a) && a.annotation_level === 'failure',
    ) ?? annotations.find(isSourceAnnotation);
  if (sourceFileAnnotation) {
    return {
      jobName,
      jobId,
      category,
      jobRetryable: false,
      reason: `Deterministic: code error in ${sourceFileAnnotation.path}:${sourceFileAnnotation.start_line}`,
      errorSnippet: sourceFileAnnotation.message!.trim().slice(0, 200),
      unmatched,
      deterministic: true,
    };
  }

  // Log-only deterministic signals (no source-file annotation).
  // Patterns live in retry-config.jsonc → deterministicErrorPatterns.
  const combinedText = [annotationText, logs ?? ''].join('\n');
  for (const re of deterministicErrorRegexes) {
    const deterministicMatch = re.exec(combinedText);
    if (deterministicMatch) {
      return {
        jobName,
        jobId,
        category,
        jobRetryable: false,
        reason: `Deterministic: ${deterministicMatch[0]}`,
        errorSnippet: deterministicMatch[0],
        unmatched,
        deterministic: true,
      };
    }
  }

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

function resolveTargetBranch(prNum: string): {
  targetBranch: string;
  verified: boolean;
} {
  const mergeQueueBranch = HEAD_BRANCH.match(/^gh-readonly-queue\/([^/]+)\//);
  if (WORKFLOW_EVENT === 'merge_group' && mergeQueueBranch) {
    return { targetBranch: mergeQueueBranch[1], verified: true };
  }

  if (WORKFLOW_EVENT !== 'pull_request' || !prNum) {
    return { targetBranch: HEAD_BRANCH, verified: true };
  }

  try {
    // workflow_run does not reliably expose the originating PR base, so query
    // it directly before applying the stricter direct-to-main E2E policy.
    const pullRequest = JSON.parse(ghApi(`${repoApi}/pulls/${prNum}`)) as {
      base?: { ref?: string };
    };
    if (pullRequest.base?.ref) {
      return { targetBranch: pullRequest.base.ref, verified: true };
    }
  } catch {
    console.warn(
      `Could not resolve the target branch for PR #${prNum}; requiring retry-ci for E2E failures.`,
    );
  }

  return { targetBranch: '', verified: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const WORKFLOW_CONCLUSION = process.env.WORKFLOW_CONCLUSION ?? '';

function writeNoRetryOutput(): void {
  if (GITHUB_OUTPUT) {
    appendFileSync(
      GITHUB_OUTPUT,
      'is-retryable=false\nhas-retry-label=false\nwill-retry=false\nconsume-retry-label=false\nretry-mode=none\npr-number=\n',
    );
  }
}

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

  writeNoRetryOutput();

  const Sentry = initSentry();
  if (Sentry) {
    const branch = resolveTargetBranch(resolvePrNumber()).targetBranch;
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

        writeNoRetryOutput();
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

  writeNoRetryOutput();
  process.exit(0);
}

console.log(`Found ${failedJobs.length} failed job(s):\n`);

const prNumber = resolvePrNumber();
const { targetBranch, verified: isTargetBranchVerified } =
  resolveTargetBranch(prNumber);
const requiresRetryCiForE2e =
  WORKFLOW_EVENT === 'pull_request' &&
  (!isTargetBranchVerified || targetBranch === 'main');

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
  const { jobsToClassify: alwaysRetryableJobs, jobsToCascade: cascadeJobs } =
    partitionRetryableBlockerCascadeJobs({
      jobs: otherJobs,
      getCategory: (jobName) => matchCategory(jobName).category,
    });

  // A structured quality-gate annotation is deterministic evidence that a
  // changed/new E2E test failed. It must still veto a retry when an unrelated
  // blocker is retryable, so inspect E2E jobs before cascading the rest.
  for (const job of alwaysRetryableJobs) {
    console.log(`  Classifying after retryable blocker: ${job.name}`);
    const result = classifyJob(job);
    classifications.push(result);
    console.log(
      `    → ${result.jobRetryable ? '✅ retryable' : '❌ non-retryable'}: ${result.reason}`,
    );
  }

  tagCascade(
    cascadeJobs,
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
// Resolve retry authorization
// ---------------------------------------------------------------------------

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

const hasPR = Boolean(prNumber);
const retryContext = hasPR
  ? 'pr'
  : WORKFLOW_EVENT === 'push' && HEAD_BRANCH.startsWith('release/')
    ? 'release-push'
    : 'observation';
const hasRetryLabel = checkRetryLabel(prNumber);
const hasMainTargetE2eFailure =
  requiresRetryCiForE2e &&
  classifications.some((job) => job.jobName.startsWith('e2e-'));
// Reducing the automatic ceiling to the current attempt makes this first
// direct-to-main E2E failure label-funded without introducing another retry
// flow. Non-main PRs and merge groups retain the default ceiling.
const retryBudget = getRetryBudget({
  attempt: ATTEMPT,
  context: retryContext,
  hasRetryLabel,
  isRetryable,
  automaticRetryLimit: hasMainTargetE2eFailure
    ? 1
    : DEFAULT_RETRY_MAX_ATTEMPT,
});
const atRetryCiLimit = retryBudget.labelRetryLimitReached;
const willRetry = retryBudget.willRetry;

// The retry decision depends on the classification result, whether the run
// has an originating PR, and the active retry budget:
//
//   isRetryable    — did classification determine all failures are retryable?
//   hasPR          — is there an originating PR? (false for push events)
//   retryContext   — PRs and release pushes can retry; other events observe
//   retryBudget    — default retries through attempt 2, retry-ci through attempt 4
//
// Attempt 1 retries automatically. Attempts 2 and 3 require retry-ci and
// consume the label after the rerun is triggered.
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
  budget: RetryBudgetDecision,
  pr: string,
  hasMainTargetE2eFailure: boolean,
): { key: string; label: string } {
  // Keep the direct-to-main E2E exception ahead of generic budget messages so
  // reviewers see the required retry-ci action instead of a vague limit note.
  if (retryable) {
    if (
      hasPr &&
      hasMainTargetE2eFailure &&
      budget.automaticRetryLimitReached &&
      !hasLabel
    )
      return {
        key: 'e2e-retry-ci-required',
        label: `⏸️ Retryable E2E failure targeting main requires retry-ci on PR #${pr}`,
      };
    if (hasPr && budget.willRetry && budget.retryMode === 'automatic')
      return {
        key: 'will-retry',
        label: `♻️ Will retry automatically (default retry budget: attempt ${budget.attemptNumber} of ${DEFAULT_RETRY_MAX_ATTEMPT})`,
      };
    if (hasPr && budget.willRetry && budget.retryMode === 'label')
      return {
        key: 'will-retry',
        label: `♻️ Will retry (retry-ci label present; attempt ${budget.attemptNumber} of ${RETRY_CI_LABEL_MAX_ATTEMPT})`,
      };
    if (hasPr && budget.labelRetryLimitReached)
      return {
        key: 'max-attempts-reached',
        label: `🛑 Retryable, but attempt ${budget.attemptNumber} reached the retry-ci limit of ${budget.labelRetryLimit}`,
      };
    if (hasPr && budget.automaticRetryLimitReached)
      return {
        key: 'retryable-no-label',
        label: `⏸️ Retryable, but the automatic retry budget ended at attempt ${budget.automaticRetryLimit}`,
      };
    if (hasPr)
      return {
        key: 'retryable-no-label',
        label: `⏸️ Retryable, but no retry-ci label on PR #${pr}`,
      };
    if (budget.willRetry && budget.retryMode === 'automatic')
      return {
        key: 'will-retry',
        label: `♻️ Will retry automatically (default retry budget: attempt ${budget.attemptNumber} of ${DEFAULT_RETRY_MAX_ATTEMPT})`,
      };
    if (budget.automaticRetryLimitReached)
      return {
        key: 'retryable-no-pr',
        label: `⏸️ Retryable, but the automatic retry budget ended at attempt ${budget.automaticRetryLimit}`,
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
    label:
      retryContext === 'release-push'
        ? '❌ Non-retryable release push'
        : '❌ Non-retryable, no originating PR (observation only)',
  };
}
const { key: decision, label: decisionLabel } = resolveDecision(
  isRetryable,
  hasPR,
  hasRetryLabel,
  retryBudget,
  prNumber,
  hasMainTargetE2eFailure,
);

if (atRetryCiLimit && isRetryable) {
  console.log(
    `${hasPR ? `PR #${prNumber}` : `Release branch ${HEAD_BRANCH}`}: attempt ${retryBudget.attemptNumber} reached the retry-ci limit (${retryBudget.labelRetryLimit}) — will not retry`,
  );
} else {
  console.log(
    prNumber
      ? `PR #${prNumber}: retry-ci label ${hasRetryLabel ? 'present' : 'absent'}, retry-mode=${retryBudget.retryMode} → will-retry=${willRetry}`
      : retryContext === 'release-push'
        ? `Release branch ${HEAD_BRANCH}: retry-mode=${retryBudget.retryMode} → will-retry=${willRetry}`
        : `No originating PR for event '${WORKFLOW_EVENT}' → will-retry=false`,
  );
}

// ---------------------------------------------------------------------------
// Post deferred failure commit status (merge queue only)
//
// ci-status-gate.yml defers the "All jobs pass" commit status for merge queue
// failures while a retry budget is still available, giving triage time to
// retry. If we decide NOT to retry (non-retryable failures, or retry limit
// reached), we must post the failure status here to unblock the merge queue
// for ejection.
//
// The merge queue requires two checks (ruleset or classic branch protection):
//   Rule 1 — Merge queue > ALLGREEN (monitors check suites directly)
//   Rule 2 — Status checks > "All jobs pass" (monitors commit status)
// Without this fallback post, Rule 2 stays pending forever and the queue
// can't eject the PR.
// ---------------------------------------------------------------------------

// The gate defers when a merge_group failure is under either the default or
// retry-ci retry budget. We can't rely on re-checking labels here because the
// API call might fail (rate limit, transient outage), and if it does, the
// deferred status would never post — leaving the queue stuck. Instead, post on
// any merge_group where we won't retry. If the gate didn't actually defer, this
// posts a redundant failure status — harmless, since ci-status-gate already
// posted one.
if (WORKFLOW_EVENT === 'merge_group' && !willRetry) {
  const headSha = getRunHeadSha();
  const description = retryBudget.labelRetryLimitReached
    ? `Retry-ci limit reached (attempt ${retryBudget.attemptNumber} of ${retryBudget.labelRetryLimit})`
    : retryBudget.automaticRetryLimitReached
      ? `Automatic retry limit reached (attempt ${retryBudget.attemptNumber} of ${retryBudget.automaticRetryLimit})`
    : isRetryable
      ? 'Retryable failures, but no retry budget available'
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
      `consume-retry-label=${retryBudget.consumeRetryLabel}`,
      `retry-mode=${retryBudget.retryMode}`,
      `automatic-retry-limit=${retryBudget.automaticRetryLimit}`,
      `automatic-retry-limit-reached=${retryBudget.automaticRetryLimitReached}`,
      `label-retry-limit=${retryBudget.labelRetryLimit}`,
      `label-retry-limit-reached=${retryBudget.labelRetryLimitReached}`,
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
  `**Retry mode:** ${retryBudget.retryMode} (automatic limit ${retryBudget.automaticRetryLimit}; retry-ci limit ${retryBudget.labelRetryLimit})`,
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

if (retryBudget.labelRetryLimitReached && isRetryable && hasPR) {
  reportLines.push(
    ``,
    `> 🛑 **Retry-ci limit reached** — attempt ${retryBudget.attemptNumber} of ${retryBudget.labelRetryLimit}. The failures look retryable, but no further retries will be attempted for this run.`,
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
// This creates a "Triage and Retry System" check on the PR's Checks tab:
//   - conclusion=neutral  → appears under "N neutral check(s)", visible
//     separately from the 190+ successful checks.
//   - conclusion=failure  → appears in the red "N failed check(s)" section
//     at the top of the page.
//
// The check is attributed to "CLA Signature Bot" in the PR Checks tab
// because GitHub groups check runs by app/check-suite, and the CLA bot's
// suite appears to claim this check. Using a dedicated GitHub App token
// instead of github.token might fix the attribution, but it's not worth
// the extra workflow step just for cosmetics.
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
    'ci.retry.mode': retryBudget.retryMode,
    'ci.retry.automaticLimit': String(retryBudget.automaticRetryLimit),
    'ci.retry.automaticLimitReached': String(
      retryBudget.automaticRetryLimitReached,
    ),
    'ci.retry.labelLimit': String(retryBudget.labelRetryLimit),
    'ci.retry.labelLimitReached': String(retryBudget.labelRetryLimitReached),
    'ci.retry.consumeRetryLabel': String(retryBudget.consumeRetryLabel),
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
      'ci.retry.mode': retryBudget.retryMode,
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
      ...(job.deterministic ? { 'ci.job.deterministic': true } : {}),
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
