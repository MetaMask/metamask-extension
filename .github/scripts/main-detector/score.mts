/**
 * Scores paired base/head benchmark jobs for the main-commit performance
 * detector. Each job runs the base and head build in alternating sessions on
 * one runner, so a job gives one log ratio of head to base per metric. A batch
 * is several jobs; a suspicious batch is confirmed by a second, independent one.
 */
import { mean, summarizeShifts, type ShiftSummary } from './stats.mts';

export type Browser = 'chrome' | 'firefox';
export const BROWSERS = ['chrome', 'firefox'] as const;

// Metrics that can raise a ping.
export const VERDICT_METRICS = ['uiStartup', 'load'] as const;
// Metrics reported to explain a ping; they never raise one.
export const BREAKDOWN_METRICS = [
  'loadScripts',
  'setupStore',
  'firstReactRender',
  'longTaskTotalDuration',
] as const;

// A series' floors in ms, and the fixed base median they are converted against.
export type SeriesFloor = { floorMs: number; loudMs: number; medianMs: number };

export type DetectorConfig = {
  // Smallest shift, in ms, that can raise a ping and the shift from which it
  // is loud, per browser and verdict metric.
  floors: Record<Browser, Record<string, SeriesFloor>>;
  // Fewest usable jobs for a batch to count as measured.
  minJobs: number;
  // Leading browser sessions dropped as warm-up.
  skipSessions: number;
};

export const DEFAULT_CONFIG: DetectorConfig = {
  // 1.5% (Chrome) and 2% (Firefox) of the base medians of the 100 `mode=aa`
  // runs of 2026-11-20; loud is 5%.
  floors: {
    chrome: {
      load: { floorMs: 13.53, loudMs: 45.1, medianMs: 902 },
      uiStartup: { floorMs: 16.095, loudMs: 53.65, medianMs: 1073 },
    },
    firefox: {
      load: { floorMs: 34.88, loudMs: 87.2, medianMs: 1744 },
      uiStartup: { floorMs: 41.5, loudMs: 103.75, medianMs: 2075 },
    },
  },
  minJobs: 4,
  skipSessions: 2,
};

export type AbSession = {
  index: number;
  build: 'A' | 'B';
  success?: boolean;
  pageLoads?: number;
};

export type JobResult = {
  sessions: AbSession[];
  samples: Record<string, number[]>;
};

const MIN_SESSIONS = 10;

/**
 * @param job - One benchmark job's session records and flattened page-load samples.
 * @param metrics - Metric names to score.
 * @param skipSessions - Leading sessions to drop as warm-up.
 * @returns The log ratio of head (B) to base (A) per metric, or undefined when the job is unusable.
 */
export function jobLogRatios(
  job: JobResult,
  metrics: readonly string[],
  skipSessions: number,
): Record<string, number> | undefined {
  const { sessions, samples } = job;
  if (
    sessions.length < MIN_SESSIONS ||
    sessions.some((session) => !session.success)
  ) {
    return undefined;
  }
  const ratios: Record<string, number> = {};
  for (const metric of metrics) {
    const values = samples[metric];
    if (!values) {
      continue;
    }
    const base: number[] = [];
    const head: number[] = [];
    let position = 0;
    for (const session of sessions) {
      // A missing sample is null in the JSON and must not count as 0.
      const loads = values
        .slice(position, position + (session.pageLoads ?? 0))
        .filter((value) => Number.isFinite(value));
      position += session.pageLoads ?? 0;
      if (session.index >= skipSessions && loads.length > 0) {
        (session.build === 'A' ? base : head).push(mean(loads));
      }
    }
    if (base.length === 0 || head.length === 0) {
      continue;
    }
    const ratio = Math.log(mean(head) / mean(base));
    if (Number.isFinite(ratio)) {
      ratios[metric] = ratio;
    }
  }
  return ratios;
}

export type Level = 'none' | 'quiet' | 'loud';
export type Direction = 'slower' | 'faster';
export type Verdict = { level: Level; direction?: Direction };

/**
 * A shift counts when it reaches the floor, in ms of the series' fixed base
 * median, and its one-sided 95% bound stays on the same side of zero.
 *
 * @param summary - Shift of one metric over a set of jobs.
 * @param floor - The series' floors in ms and the median they are converted against.
 */
export function classify(summary: ShiftSummary, floor: SeriesFloor): Verdict {
  const shiftMs = (floor.medianMs * summary.shiftPct) / 100;
  const slower = shiftMs >= floor.floorMs && summary.lowerPct > 0;
  const faster = shiftMs <= -floor.floorMs && summary.upperPct < 0;
  if (!slower && !faster) {
    return { level: 'none' };
  }
  return {
    level: Math.abs(shiftMs) >= floor.loudMs ? 'loud' : 'quiet',
    direction: slower ? 'slower' : 'faster',
  };
}

export type MetricScore = { summary?: ShiftSummary; verdict: Verdict };

export type BatchScore = {
  jobsTotal: number;
  jobsUsable: number;
  measurable: boolean;
  logRatios: Record<string, number[]>;
  metrics: Record<string, MetricScore>;
};

export function scoreBatch(
  browser: Browser,
  jobs: JobResult[],
  config: DetectorConfig,
): BatchScore {
  const names = [...VERDICT_METRICS, ...BREAKDOWN_METRICS];
  const logRatios: Record<string, number[]> = {};
  let jobsUsable = 0;
  for (const job of jobs) {
    const ratios = jobLogRatios(job, names, config.skipSessions);
    // A job with no ratio for a verdict metric (empty or renamed samples) cannot show a change.
    if (
      !ratios ||
      VERDICT_METRICS.some((metric) => ratios[metric] === undefined)
    ) {
      continue;
    }
    jobsUsable += 1;
    for (const [metric, ratio] of Object.entries(ratios)) {
      (logRatios[metric] ??= []).push(ratio);
    }
  }
  const metrics: Record<string, MetricScore> = {};
  for (const metric of names) {
    const summary = summarizeShifts(logRatios[metric] ?? []);
    metrics[metric] = {
      summary,
      // Breakdown metrics have no floor and never raise a ping.
      verdict:
        summary && config.floors[browser][metric]
          ? classify(summary, config.floors[browser][metric])
          : { level: 'none' },
    };
  }
  return {
    jobsTotal: jobs.length,
    jobsUsable,
    measurable: jobsUsable >= config.minJobs,
    logRatios,
    metrics,
  };
}

export type BatchScores = Record<Browser, BatchScore>;

// Verdict metrics that crossed a threshold in one batch.
function suspiciousMetrics(score: BatchScore) {
  return VERDICT_METRICS.filter(
    (metric) => score.metrics[metric].verdict.level !== 'none',
  );
}

/**
 * @param first - Scores of the first batch.
 * @returns Whether any browser and metric is suspicious enough to need a second batch.
 */
export function needsConfirmation(first: BatchScores): boolean {
  return BROWSERS.some(
    (browser) =>
      first[browser].measurable && suspiciousMetrics(first[browser]).length > 0,
  );
}

export type Finding = {
  browser: Browser;
  metric: string;
  direction: Direction;
  level: Exclude<Level, 'none'>;
  first: ShiftSummary;
  second: ShiftSummary;
  pooled: ShiftSummary;
};

export type Decision = {
  ping: Level;
  findings: Finding[];
  // Browsers whose first batch, or its needed confirmation, could not be measured.
  unmeasured: Browser[];
};

/**
 * A finding is confirmed when the pooled jobs of both batches pass the rule
 * and the first batch and the second batch each pass it alone, in the same
 * direction as the pooled result.
 *
 * @param first - Scores of the first batch.
 * @param second - Scores of the confirmation batch, absent when none was run.
 * @param config - Floors and limits.
 */
export function decide(
  first: BatchScores,
  second: BatchScores | undefined,
  config: DetectorConfig,
): Decision {
  const findings: Finding[] = [];
  const unmeasured: Browser[] = [];
  for (const browser of BROWSERS) {
    if (!first[browser].measurable) {
      unmeasured.push(browser);
      continue;
    }
    const suspicious = suspiciousMetrics(first[browser]);
    if (suspicious.length === 0) {
      continue;
    }
    if (!second?.[browser].measurable) {
      unmeasured.push(browser);
      continue;
    }
    for (const metric of suspicious) {
      const firstSummary = first[browser].metrics[metric].summary;
      const secondSummary = second[browser].metrics[metric].summary;
      const pooled = summarizeShifts([
        ...first[browser].logRatios[metric],
        ...(second[browser].logRatios[metric] ?? []),
      ]);
      if (!firstSummary || !secondSummary || !pooled) {
        unmeasured.push(browser);
        break;
      }
      const floor = config.floors[browser][metric];
      const verdict = classify(pooled, floor);
      const sameWay =
        first[browser].metrics[metric].verdict.direction ===
          verdict.direction &&
        classify(secondSummary, floor).direction === verdict.direction;
      if (verdict.level !== 'none' && verdict.direction && sameWay) {
        findings.push({
          browser,
          metric,
          direction: verdict.direction,
          level: verdict.level,
          first: firstSummary,
          second: secondSummary,
          pooled,
        });
      }
    }
  }
  let ping: Level = 'none';
  if (findings.some((finding) => finding.level === 'loud')) {
    ping = 'loud';
  } else if (findings.length > 0) {
    ping = 'quiet';
  }
  return { ping, findings, unmeasured };
}
