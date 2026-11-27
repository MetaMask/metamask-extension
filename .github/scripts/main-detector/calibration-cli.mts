// origin: ai-synthesis
/**
 * Usage: node .github/scripts/main-detector/calibration-cli.mts [--days 7] [--out calibration.json] [--summary FILE] [--run-url URL] [--post] [--event workflow_run]
 * Reads the `detector-result` artifacts of the detector runs of the last
 * --days days, keeps those of A/A canaries, and checks the floors against them
 * (see calibration.mts). Posts to Slack when the check pings, on a schedule
 * run or with --post; otherwise it prints the message. Runs no benchmark.
 * --event workflow_dispatch reads the manual runs instead, whose `mode=aa`
 * runs are canaries too, to try the check on data before the workflow runs on main.
 * Needs the `gh` CLI.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { REPOSITORY } from './build-source.mts';
import {
  buildCalibrationMessage,
  renderCalibration,
  summarizeCanaries,
  type DetectorResult,
} from './calibration.mts';
import { postOrPrint, requireSlackInCi } from './post-slack.mts';

const run = (args: string[]) =>
  execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param since - Start of the window.
 * @returns The ids of the commit-check runs created since then. A run that was
 * cancelled left no result; the rest may have one.
 */
function commitCheckRuns(since: Date, event: string): number[] {
  const text = run([
    'api',
    '--paginate',
    `repos/${REPOSITORY}/actions/workflows/main-detector.yml/runs?event=${event}&created=%3E%3D${since.toISOString().slice(0, 10)}&per_page=100`,
    '--jq',
    '.workflow_runs[] | select(.conclusion != "cancelled") | .id',
  ]);
  return text.split('\n').filter(Boolean).map(Number);
}

function hasResult(runId: number): boolean {
  return (
    run([
      'api',
      `repos/${REPOSITORY}/actions/runs/${runId}/artifacts?per_page=100`,
      '--jq',
      '[.artifacts[] | select(.name == "detector-result" and (.expired | not))] | length',
    ]) !== '0'
  );
}

function readResult(runId: number, directory: string): DetectorResult {
  const target = path.join(directory, String(runId));
  run([
    'run',
    'download',
    String(runId),
    '-R',
    REPOSITORY,
    '-n',
    'detector-result',
    '-D',
    target,
  ]);
  return JSON.parse(fs.readFileSync(path.join(target, 'result.json'), 'utf8'));
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      days: { type: 'string', default: '7' },
      out: { type: 'string' },
      summary: { type: 'string' },
      'run-url': { type: 'string', default: '' },
      post: { type: 'boolean', default: false },
      event: { type: 'string', default: 'workflow_run' },
    },
  });
  const days = Number(values.days);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('--days must be a positive integer');
  }
  requireSlackInCi();

  const now = Date.now();
  const since = new Date(now - days * DAY_MS);
  const range = `${since.toISOString().slice(0, 10)}..${new Date(now).toISOString().slice(0, 10)}`;
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'detector-canaries-'),
  );
  const results: DetectorResult[] = [];
  const runs = commitCheckRuns(since, values.event as string).filter(hasResult);
  for (const runId of runs) {
    results.push(readResult(runId, directory));
  }

  const report = summarizeCanaries(results);
  const summary = renderCalibration(report, range);
  console.log(
    `${runs.length} detector runs with a result, ${report.canaries} canaries, ${report.ping ? 'pinging' : 'no ping'}.`,
  );
  console.log(summary);
  if (values.summary) {
    fs.appendFileSync(values.summary, `${summary}\n`);
  }
  if (values.out) {
    fs.writeFileSync(values.out, JSON.stringify(report, null, 2));
  }
  // A week with no readable canary checked nothing, so fail rather than pass green.
  if (report.canaries === 0) {
    process.exitCode = 1;
  }
  if (!report.ping) {
    return;
  }
  const payload = buildCalibrationMessage(report, range, values['run-url']);
  if (process.env.GITHUB_EVENT_NAME === 'schedule' || values.post) {
    await postOrPrint(payload);
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
