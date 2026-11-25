// origin: ai-synthesis
// source_refs: #48049 (paired decision rule), #48068 (rule per admitted series), #47800 (gate on main commits)
/**
 * Scores the critical user flows (CUFs) of a main commit with ADR 0072's
 * paired decision rule. Each CUF job runs one flow's iterations on base (A)
 * and head (B) builds alternating per iteration, so consecutive iterations
 * (0, 1), (2, 3), ... are pairs, and each pair gives one head-minus-base
 * difference per series. The rule works on differences in milliseconds, not
 * on log ratios, so a series whose base is 0 ms (a long-task total) scores.
 */
import path from 'node:path';
// The detector runs without an install, so these two files import nothing.
import { ADMITTED_SERIES } from '../../../test/e2e/benchmarks/utils/admitted-series.ts';
import {
  decidePaired,
  type PairedDecision,
} from '../../../test/e2e/benchmarks/utils/paired-decision.ts';
import { readJobFlows } from './load.mts';
import type { JobResult } from './score.mts';

/** The file of each flow with an admitted CUF series, by its result key. */
export const CUF_FLOW_FILES: Readonly<Record<string, string>> = {
  bridgeUserActions:
    'test/e2e/benchmarks/flows/interaction/bridge-user-actions.ts',
  loadNewAccount: 'test/e2e/benchmarks/flows/interaction/load-new-account.ts',
  assetDetails: 'test/e2e/benchmarks/flows/user-journey/asset-details.ts',
  solanaAssetDetails:
    'test/e2e/benchmarks/flows/user-journey/solana-asset-details.ts',
};

/**
 * `block`: the lower bound exceeds `δ_block`. `no-block`: it does not.
 * `unable`: too few pairs for a 95% bound. `incomplete`: no usable pair.
 */
export type CufVerdict = 'block' | 'no-block' | 'unable' | 'incomplete';

export type CufOutcome = {
  series: string;
  deltaBlockMs: number;
  verdict: CufVerdict;
  /** Jobs that gave at least one pair. */
  jobs: number;
  /** Pairs dropped: a failed iteration, a missing value or two runs of one build. */
  droppedPairs: number;
  decision?: PairedDecision;
};

export type CufResult = {
  outcomes: CufOutcome[];
  /** Series whose verdict is `block`. */
  findings: string[];
  /** Series with no verdict: `unable` or `incomplete`. */
  unmeasured: string[];
};

export function splitSeries(series: string): { flow: string; metric: string } {
  const [flow, ...rest] = series.split('.');
  return { flow, metric: rest.join('.') };
}

/** The admitted series the CUF jobs measure: every one outside startup. */
export function cufSeries() {
  return ADMITTED_SERIES.filter(
    (entry) => splitSeries(entry.series).flow in CUF_FLOW_FILES,
  );
}

/**
 * @param job - One flow's A/B sessions and per-iteration samples from one job.
 * @param metric - The series' timer id.
 * @returns Head minus base for each pair of consecutive iterations that both
 * succeeded, ran different builds and reported a value, and how many pairs
 * were dropped.
 */
export function pairDifferences(
  job: JobResult,
  metric: string,
): { differences: number[]; dropped: number } {
  const values = job.samples[metric] ?? [];
  const byPair = new Map<number, JobResult['sessions']>();
  for (const session of job.sessions) {
    const key = Math.floor(session.index / 2);
    byPair.set(key, [...(byPair.get(key) ?? []), session]);
  }
  const differences: number[] = [];
  let dropped = 0;
  for (const sessions of byPair.values()) {
    const base = sessions.find((session) => session.build === 'A');
    const head = sessions.find((session) => session.build === 'B');
    const baseValue = base && values[base.index];
    const headValue = head && values[head.index];
    if (
      sessions.length === 2 &&
      base?.success &&
      head?.success &&
      Number.isFinite(baseValue) &&
      Number.isFinite(headValue)
    ) {
      differences.push((headValue as number) - (baseValue as number));
    } else {
      dropped += 1;
    }
  }
  return { differences, dropped };
}

/**
 * @param jobsByFlow - Each flow's jobs, one entry per job that gave A/B data.
 */
export function scoreCufs(
  jobsByFlow: Readonly<Record<string, readonly JobResult[]>>,
): CufResult {
  const outcomes = cufSeries().map(({ series, deltaBlockMs }): CufOutcome => {
    const { flow, metric } = splitSeries(series);
    const differences: number[] = [];
    let jobs = 0;
    let droppedPairs = 0;
    for (const job of jobsByFlow[flow] ?? []) {
      const paired = pairDifferences(job, metric);
      differences.push(...paired.differences);
      droppedPairs += paired.dropped;
      jobs += paired.differences.length > 0 ? 1 : 0;
    }
    if (differences.length === 0) {
      return {
        series,
        deltaBlockMs,
        verdict: 'incomplete',
        jobs,
        droppedPairs,
      };
    }
    const decision = decidePaired(differences, deltaBlockMs);
    return {
      series,
      deltaBlockMs,
      verdict: decision.verdict,
      jobs,
      droppedPairs,
      decision,
    };
  });
  return {
    outcomes,
    findings: outcomes
      .filter((outcome) => outcome.verdict === 'block')
      .map((outcome) => outcome.series),
    unmeasured: outcomes
      .filter(
        (outcome) =>
          outcome.verdict === 'unable' || outcome.verdict === 'incomplete',
      )
      .map((outcome) => outcome.series),
  };
}

/**
 * @param root - Folder holding the downloaded artifacts.
 * @param shards - Jobs per flow, in detector-cuf-<flow>-s<shard> folders.
 */
export function loadCufJobs(
  root: string,
  shards: number,
): Record<string, JobResult[]> {
  const jobsByFlow: Record<string, JobResult[]> = {};
  for (const flow of Object.keys(CUF_FLOW_FILES)) {
    jobsByFlow[flow] = Array.from(
      { length: shards },
      (_, shard) =>
        readJobFlows(path.join(root, `detector-cuf-${flow}-s${shard + 1}`))[
          flow
        ],
    ).filter((job): job is JobResult => job !== undefined);
  }
  return jobsByFlow;
}

const ms = (value: number | null | undefined) =>
  value === null || value === undefined
    ? 'n/a'
    : `${value >= 0 ? '+' : ''}${value.toFixed(1)} ms`;

/** One line for a series' outcome, in the report and in Slack. */
export function formatCufOutcome(outcome: CufOutcome): string {
  const { decision } = outcome;
  const pairs = `${decision?.n ?? 0} pairs from ${outcome.jobs} job${outcome.jobs === 1 ? '' : 's'}`;
  switch (outcome.verdict) {
    case 'incomplete':
      return outcome.droppedPairs > 0
        ? `no usable pair (${outcome.droppedPairs} dropped)`
        : 'no job gave A/B data';
    case 'unable':
      return `${pairs} are too few for a 95% bound`;
    default:
      return `shift ${ms(decision?.shift)}, lower bound ${ms(decision?.lower)} against δ_block ${outcome.deltaBlockMs} ms, ${pairs}`;
  }
}

const VERDICT_LABELS: Record<CufVerdict, string> = {
  block: 'slower',
  'no-block': 'no change',
  unable: 'could not measure',
  incomplete: 'could not measure',
};

/** The CUF section of the step summary. */
export function renderCufSummary(result: CufResult): string[] {
  return [
    '#### Critical user flows (paired rule, Chrome)',
    '',
    "Slower when the one-sided 95% lower bound of the Hodges-Lehmann shift of head-minus-base iteration pairs exceeds the series' δ_block.",
    '',
    '| Series | Verdict | Detail |',
    '|---|---|---|',
    ...result.outcomes.map(
      (outcome) =>
        `| ${outcome.series} | ${VERDICT_LABELS[outcome.verdict]} | ${formatCufOutcome(outcome)} |`,
    ),
    '',
  ];
}
