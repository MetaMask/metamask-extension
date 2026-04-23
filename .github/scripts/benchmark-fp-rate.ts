import * as fs from 'fs';
import * as path from 'path';
import { getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

/**
 * Weekly computation of the benchmark quality-gate false-positive-rate proxy.
 *
 * FP rate proxy = (PRs merged with the `skip-benchmark-gate` label)
 *                / (PRs merged where the quality-gate check ran).
 *
 * This is a proxy, not ground truth — a developer applies the label when they
 * believe a gate failure is noise. Reported as input signal for trust-building,
 * tracked against the Phase 3 target of < 5%.
 *
 * Outputs a row in `fp-rates.json` keyed by ISO week (e.g. `2026-W15`).
 */

type Env = {
  GITHUB_TOKEN: string;
  OWNER: string;
  REPOSITORY: string;
  OUTPUT_PATH: string;
  WINDOW_DAYS: number;
};

type WeeklyReport = {
  totalGatedPrs: number;
  skippedPrs: number;
  failedGatedPrs: number;
  rate: number;
  windowStart: string;
  windowEnd: string;
};

type FpReportFile = Record<string, WeeklyReport>;

const SKIP_LABEL = 'skip-benchmark-gate';
const GATE_CHECK_NAME = 'quality-gate';
const GATE_CHECK_NAME_FALLBACK = 'benchmark-gate';

function loadEnv(): Env {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable must be set');
  }
  return {
    GITHUB_TOKEN: token,
    OWNER: process.env.OWNER || 'MetaMask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    OUTPUT_PATH: process.env.OUTPUT_PATH || 'fp-rates.json',
    WINDOW_DAYS: Number(process.env.WINDOW_DAYS || 7),
  };
}

/**
 * ISO-8601 week key (e.g. "2026-W15") for the given date.
 */
export function isoWeekKey(date: Date): string {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayOfWeek = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

async function fetchMergedPrs(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  windowStart: Date,
): Promise<
  {
    number: number;
    mergedAt: string;
    mergeCommitSha: string | null;
    labels: string[];
  }[]
> {
  const since = windowStart.toISOString();
  const prs: {
    number: number;
    mergedAt: string;
    mergeCommitSha: string | null;
    labels: string[];
  }[] = [];

  for await (const page of octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner,
    repo,
    state: 'closed',
    base: 'main',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  })) {
    for (const pr of page.data) {
      if (!pr.merged_at) {
        continue;
      }
      if (pr.updated_at < since) {
        return prs;
      }
      if (pr.merged_at < since) {
        continue;
      }
      prs.push({
        number: pr.number,
        mergedAt: pr.merged_at,
        mergeCommitSha: pr.merge_commit_sha,
        labels: (pr.labels ?? []).map((l) => l.name).filter(Boolean),
      });
    }
  }
  return prs;
}

async function gateRanAndStatus(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  sha: string | null,
): Promise<{ ran: boolean; failed: boolean }> {
  if (!sha) {
    return { ran: false, failed: false };
  }
  // Filter by check_name server-side so pagination is not required even when a
  // merge commit has hundreds of check runs (e.g. ~350 in this repo). A plain
  // per_page:100 fetch would miss the gate check on pages 2+ and silently drop
  // those PRs from the denominator, biasing the FP-rate proxy upward.
  const [primary, fallback] = await Promise.all([
    octokit.rest.checks.listForRef({
      owner,
      repo,
      ref: sha,
      check_name: GATE_CHECK_NAME,
      per_page: 100,
    }),
    octokit.rest.checks.listForRef({
      owner,
      repo,
      ref: sha,
      check_name: GATE_CHECK_NAME_FALLBACK,
      per_page: 100,
    }),
  ]);
  const gateChecks = [...primary.data.check_runs, ...fallback.data.check_runs];
  if (gateChecks.length === 0) {
    return { ran: false, failed: false };
  }
  const failed = gateChecks.some(
    (run) =>
      run.conclusion === 'failure' ||
      run.conclusion === 'timed_out' ||
      run.conclusion === 'action_required',
  );
  return { ran: true, failed };
}

export async function computeWeeklyReport(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  windowDays: number,
  now: Date = new Date(),
): Promise<WeeklyReport> {
  const windowEnd = now;
  const windowStart = new Date(
    windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000,
  );

  const prs = await fetchMergedPrs(octokit, owner, repo, windowStart);

  let totalGatedPrs = 0;
  let skippedPrs = 0;
  let failedGatedPrs = 0;

  for (const pr of prs) {
    const skipped = pr.labels.includes(SKIP_LABEL);
    const { ran, failed } = await gateRanAndStatus(
      octokit,
      owner,
      repo,
      pr.mergeCommitSha,
    );

    if (ran) {
      totalGatedPrs += 1;
      if (skipped) {
        skippedPrs += 1;
      }
      if (failed) {
        failedGatedPrs += 1;
      }
    }
  }

  const rate = totalGatedPrs > 0 ? skippedPrs / totalGatedPrs : 0;
  return {
    totalGatedPrs,
    skippedPrs,
    failedGatedPrs,
    rate: Number(rate.toFixed(4)),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  };
}

function writeReport(
  outputPath: string,
  weekKey: string,
  report: WeeklyReport,
): void {
  const absolutePath = path.resolve(outputPath);
  let existing: FpReportFile = {};
  try {
    const raw = fs.readFileSync(absolutePath, 'utf8');
    if (raw.trim().length > 0) {
      existing = JSON.parse(raw) as FpReportFile;
    }
  } catch {
    // File does not exist yet — start with empty object
  }
  existing[weekKey] = report;
  fs.writeFileSync(absolutePath, `${JSON.stringify(existing, null, 2)}\n`);
}

async function main(): Promise<void> {
  const env = loadEnv();
  const octokit = getOctokit(env.GITHUB_TOKEN);

  const now = new Date();
  const weekKey = isoWeekKey(now);

  console.log(
    `Computing benchmark FP rate for ${env.OWNER}/${env.REPOSITORY} over ${env.WINDOW_DAYS} days (week ${weekKey})`,
  );

  const report = await computeWeeklyReport(
    octokit,
    env.OWNER,
    env.REPOSITORY,
    env.WINDOW_DAYS,
    now,
  );

  console.log(
    `Window ${report.windowStart} → ${report.windowEnd}: ` +
      `${report.totalGatedPrs} PRs ran the gate, ` +
      `${report.failedGatedPrs} failed, ` +
      `${report.skippedPrs} had "${SKIP_LABEL}" (rate ${(
        report.rate * 100
      ).toFixed(2)}%).`,
  );

  writeReport(env.OUTPUT_PATH, weekKey, report);
  console.log(`Wrote report to ${env.OUTPUT_PATH} under key "${weekKey}"`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
