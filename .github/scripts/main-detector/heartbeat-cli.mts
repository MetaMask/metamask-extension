/**
 * Usage: node .github/scripts/main-detector/heartbeat-cli.mts [--window-hours 24] [--settle-hours 3]
 * Checks that every Main run that finished in the window got a detector run,
 * and posts to Slack only when something is wrong. With no
 * SLACK_BOT_TOKEN set it prints the message instead; SLACK_CHANNEL names the
 * channel to post to.
 * Needs no npm dependencies, so the workflow runs it without an install.
 */
import { appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { ghApi } from '../shared/gh-api.mts';
import {
  assessHealth,
  buildHeartbeatMessage,
  latestSlot,
  type RunInfo,
} from './heartbeat.mts';
import { postOrPrint, requireSlackInCi } from './post-slack.mts';

const REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';
const HOUR_MS = 60 * 60 * 1000;

type ListedRun = RunInfo & { title: string; finishedAt: string };

function listRuns(
  workflow: string,
  createdSince: Date,
  filters = '',
): ListedRun[] {
  const created = encodeURIComponent(`>=${createdSince.toISOString()}`);
  const output = ghApi(
    `repos/${REPOSITORY}/actions/workflows/${workflow}/runs?per_page=100&created=${created}${filters}`,
    {
      paginate: true,
      jq: '.workflow_runs[] | {sha: .head_sha, title: .display_title, conclusion, url: .html_url, finishedAt: .updated_at}',
    },
  );
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

// The detector names each run after the commit it checks; the run's own
// head_sha is the default branch tip, not that commit.
const shaOf = (title: string) => title.match(/[0-9a-f]{40}/u)?.[0] ?? '';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'window-hours': { type: 'string', default: '24' },
      'settle-hours': { type: 'string', default: '3' },
    },
  });
  requireSlackInCi();
  const settleHours = Number(values['settle-hours']);
  const windowHours = Number(values['window-hours']);
  if (!(settleHours >= 0) || !(windowHours > 0)) {
    throw new Error('--settle-hours must be >= 0 and --window-hours > 0');
  }
  const to = latestSlot(Date.now()) - settleHours * HOUR_MS;
  const from = to - windowHours * HOUR_MS;

  // Main runs can start long before they finish, so look back further.
  const mainRuns = listRuns(
    'main.yml',
    new Date(from - 12 * HOUR_MS),
    '&branch=main&event=push&status=completed',
  ).filter((run) => {
    const finished = Date.parse(run.finishedAt);
    return finished >= from && finished < to;
  });
  const detectorRuns = listRuns('main-detector.yml', new Date(from))
    .map((run) => ({ ...run, sha: shaOf(run.title) }))
    // Positive controls and canaries say nothing about whether the commit was checked.
    .filter((run) => run.sha !== '' && !/\((aa|inject)\)/u.test(run.title));

  const health = assessHealth(mainRuns, detectorRuns);
  const line = `Main finished ${health.expected} commit(s) between ${new Date(from).toISOString()} and ${new Date(to).toISOString()}: ${health.missing.length} without a detector run, ${health.failed.length} with only failed runs (${health.status}).`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Main performance detector health\n\n${line}\n`,
    );
  }
  if (health.status !== 'problem') {
    return;
  }

  const payload = buildHeartbeatMessage(
    health,
    REPOSITORY,
    process.env.RUN_URL ?? '',
  );
  await postOrPrint(payload);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
