// Drift on `main` (ADR 0072): each scheduled run decides every admitted series
// of the current `main` build against a pinned reference build with the paired
// decision rule. A series drifts when it blocks in two consecutive scheduled
// runs, which opens an issue and blocks nothing. Called by benchmark-drift.yml.

import { promises as fs } from 'fs';
import path from 'path';
import { parseArgs } from 'util';

import { isPlainObject } from '@metamask/utils';
import { loadCurrentBenchmarks } from './compare-benchmarks';
import {
  evaluatePairedGate,
  formatPairedOutcome,
  PAIRED_SOURCE,
  type PairedGateOutcome,
  type PairedGateVerdict,
} from './paired-gate';

/** One series' result in one scheduled run. */
export type DriftSeriesResult = {
  verdict: PairedGateVerdict;
  shiftMs: number | null;
  lowerMs: number | null;
  deltaBlockMs: number;
};

/** What one run hands the next. */
export type DriftState = {
  referenceSha: string;
  headSha: string;
  runUrl: string;
  series: Record<string, DriftSeriesResult>;
};

/** A series that blocked in this run and the one before. */
export type Drift = {
  series: string;
  current: DriftSeriesResult;
  previous: DriftSeriesResult;
};

export type DriftIssue = { series: string; title: string; body: string };

export const STATE_FILE = 'benchmark-drift-state.json';

const VERDICTS: readonly PairedGateVerdict[] = [
  'block',
  'no-block',
  'unable',
  'incomplete',
  'deferred',
];

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || typeof value === 'number';

// This run's state from the paired gate's outcomes, Chrome's paired jobs only.
export function toDriftState(
  outcomes: readonly PairedGateOutcome[],
  run: Omit<DriftState, 'series'>,
): DriftState {
  const series: Record<string, DriftSeriesResult> = {};
  for (const outcome of outcomes) {
    if (outcome.source === PAIRED_SOURCE) {
      series[outcome.series] = {
        verdict: outcome.verdict,
        shiftMs: outcome.decision?.shift ?? null,
        lowerMs: outcome.decision?.lower ?? null,
        deltaBlockMs: outcome.deltaBlockMs,
      };
    }
  }
  return { ...run, series };
}

// A previous run's state, or `undefined` when `raw` is not one. A malformed
// series entry is dropped, which reads as not blocked.
export function parseDriftState(raw: unknown): DriftState | undefined {
  if (
    !isPlainObject(raw) ||
    typeof raw.referenceSha !== 'string' ||
    typeof raw.headSha !== 'string' ||
    typeof raw.runUrl !== 'string' ||
    !isPlainObject(raw.series)
  ) {
    return undefined;
  }
  const series: Record<string, DriftSeriesResult> = {};
  for (const [name, result] of Object.entries(raw.series)) {
    if (
      isPlainObject(result) &&
      VERDICTS.includes(result.verdict as PairedGateVerdict) &&
      isNullableNumber(result.shiftMs) &&
      isNullableNumber(result.lowerMs) &&
      typeof result.deltaBlockMs === 'number'
    ) {
      series[name] = {
        verdict: result.verdict as PairedGateVerdict,
        shiftMs: result.shiftMs,
        lowerMs: result.lowerMs,
        deltaBlockMs: result.deltaBlockMs,
      };
    }
  }
  return {
    referenceSha: raw.referenceSha,
    headSha: raw.headSha,
    runUrl: raw.runUrl,
    series,
  };
}

// A series drifts when it blocks in this run and the previous scheduled run,
// so one chance block or one faulty runner reports nothing. A missing previous
// state, or one against another reference, has no blocks.
export function findDrifts(
  current: DriftState,
  previous: DriftState | undefined,
): Drift[] {
  if (!previous || previous.referenceSha !== current.referenceSha) {
    return [];
  }
  return Object.entries(current.series).flatMap(([series, result]) => {
    const before = previous.series[series];
    return result.verdict === 'block' && before?.verdict === 'block'
      ? [{ series, current: result, previous: before }]
      : [];
  });
}

const ms = (value: number | null): string =>
  value === null ? 'n/a' : `${value.toFixed(1)} ms`;

const shiftAndBound = (result: DriftSeriesResult): string =>
  `shift ${ms(result.shiftMs)}, lower bound ${ms(result.lowerMs)}`;

export function driftIssueTitle(series: string): string {
  return `Benchmark drift: ${series}`;
}

export function driftIssue(
  drift: Drift,
  current: DriftState,
  previous: DriftState,
): DriftIssue {
  const body = [
    `\`${drift.series}\` blocked against the pinned reference build in two consecutive scheduled runs: its lower bound exceeds δ_block (${ms(drift.current.deltaBlockMs)}).`,
    '',
    '| run | head | shift | lower bound |',
    '| --- | --- | --- | --- |',
    `| [latest](${current.runUrl}) | ${current.headSha} | ${ms(drift.current.shiftMs)} | ${ms(drift.current.lowerMs)} |`,
    `| [previous](${previous.runUrl}) | ${previous.headSha} | ${ms(drift.previous.shiftMs)} | ${ms(drift.previous.lowerMs)} |`,
    '',
    `Reference: ${current.referenceSha} (the repository variable \`BENCHMARK_DRIFT_REFERENCE_SHA\`).`,
    '',
    'A drift blocks no pull request or release. Find the commits between the reference and the head that moved this series, then fix them or accept the change; accepting it moves the reference to the current `main` build.',
  ].join('\n');
  return { series: drift.series, title: driftIssueTitle(drift.series), body };
}

// One Slack message for every series that drifted in this run, `undefined`
// when none did.
export function driftSlackPayload(
  drifts: readonly Drift[],
  current: DriftState,
  issuesUrl: string,
): { text: string } | undefined {
  if (drifts.length === 0) {
    return undefined;
  }
  const lines = drifts.map(
    (drift) =>
      `• \`${drift.series}\`: ${shiftAndBound(drift.current)} against δ_block ${ms(drift.current.deltaBlockMs)}`,
  );
  return {
    text: [
      `Extension benchmark drift on main: ${drifts.length} series blocked against reference ${current.referenceSha.slice(0, 10)} in two consecutive scheduled runs (head ${current.headSha.slice(0, 10)}).`,
      ...lines,
      `<${issuesUrl}|Drift issues> · <${current.runUrl}|Run>`,
    ].join('\n'),
  };
}

async function readPrevious(file: string): Promise<DriftState | undefined> {
  try {
    return parseDriftState(JSON.parse(await fs.readFile(file, 'utf-8')));
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      current: { type: 'string' },
      previous: { type: 'string' },
      out: { type: 'string' },
      'reference-sha': { type: 'string' },
      'head-sha': { type: 'string' },
      'run-url': { type: 'string' },
      'issues-url': { type: 'string' },
    },
    strict: true,
  });
  const {
    current: currentDir,
    previous: previousFile,
    out,
    'reference-sha': referenceSha,
    'head-sha': headSha,
    'run-url': runUrl,
    'issues-url': issuesUrl,
  } = values;
  if (
    !currentDir ||
    !previousFile ||
    !out ||
    !referenceSha ||
    !headSha ||
    !runUrl ||
    !issuesUrl
  ) {
    console.error(
      'Usage: --current <dir> --previous <file> --out <dir> --reference-sha <sha> --head-sha <sha> --run-url <url> --issues-url <url>',
    );
    process.exit(2);
  }

  const benchmarks = await loadCurrentBenchmarks(currentDir).catch(() => []);
  const outcomes = evaluatePairedGate(benchmarks, true, true);
  for (const outcome of outcomes) {
    console.log(formatPairedOutcome(outcome));
  }

  const current = toDriftState(outcomes, { referenceSha, headSha, runUrl });
  const previous = await readPrevious(previousFile);
  const drifts = findDrifts(current, previous);
  const issues = previous
    ? drifts.map((drift) => driftIssue(drift, current, previous))
    : [];
  console.log(
    `\n${drifts.length} series drifted${drifts.map(({ series }) => `\n  ${series}`).join('')}`,
  );

  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, STATE_FILE), JSON.stringify(current));
  await fs.writeFile(path.join(out, 'drifts.json'), JSON.stringify(issues));
  const slack = driftSlackPayload(drifts, current, issuesUrl);
  if (slack) {
    await fs.writeFile(path.join(out, 'slack.json'), JSON.stringify(slack));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(2);
  });
}
