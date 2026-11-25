/**
 * Scores paired base/head benchmark jobs for the main-commit performance
 * detector. Each job runs the base and head build in alternating sessions on
 * one runner, so a job gives one shift of head over base per metric, as a log
 * ratio and in ms. A batch is several jobs; a suspicious batch is confirmed by
 * a second, independent one.
 */
import {
  mean,
  summarizeJobShifts,
  type JobShift,
  type MsShiftSummary as ShiftSummary,
} from './stats.mts';

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

// Smallest shift, in ms, that can raise a ping, and the shift from which a
// ping is loud, for one series.
export type SeriesFloor = { floorMs: number; loudMs: number };

export type DetectorConfig = {
  // Browsers the batch holds scores for, in the order they are reported.
  browsers: readonly Browser[];
  // Per browser and verdict metric. A metric with no entry never raises a ping.
  floors: Record<Browser, Record<string, SeriesFloor>>;
  // Fewest usable jobs for a batch to count as measured.
  minJobs: number;
  // Leading browser sessions dropped as warm-up.
  skipSessions: number;
};

export const DEFAULT_CONFIG: DetectorConfig = {
  browsers: BROWSERS,
  // A floor is in ms because noise has a part that does not scale with the
  // series, so a percentage is meaningless on a short one: 1.5% of 30 ms is
  // below timer jitter. Set a series' floor from its own A/A runs at about 2 to
  // 3 SD of the mean shift of one batch, and keep it above timer resolution.
  // The ping also needs the one-sided 95% bound on the same side of zero and a
  // second batch that agrees.
  //
  // The 100 `mode=aa` runs of 2026-11-20 gave these SDs of a batch's mean
  // shift (Chrome load, Chrome uiStartup, Firefox load, Firefox uiStartup):
  // 4.8, 5.2, 15.6 and 22.6 ms, so the floors below are 2.8, 3.1, 2.2 and 1.8
  // SD. Loud is 5% of those runs' base medians (902, 1073, 1744 and 2075 ms).
  floors: {
    chrome: {
      load: { floorMs: 13.5, loudMs: 45.1 },
      uiStartup: { floorMs: 16.1, loudMs: 53.7 },
    },
    firefox: {
      load: { floorMs: 34.9, loudMs: 87.2 },
      uiStartup: { floorMs: 41.5, loudMs: 103.8 },
    },
  },
  minJobs: 4,
  skipSessions: 2,
};

export type StartupPreset = 'startupStandardHome' | 'startupPowerUserHome';

// Chrome floors of the power-user preset, set like the standard preset's: 1.5%
// of the base median and loud at 5%. The medians (781 and 1117 ms) are those of
// the 26 jobs of the six `mode=aa` power-user runs of 2026-11-25, not of 100
// runs, so the floors are provisional until the weekly calibration has more.
const POWER_USER_CHROME_FLOORS: Record<string, SeriesFloor> = {
  load: { floorMs: 11.7, loudMs: 39 },
  uiStartup: { floorMs: 16.75, loudMs: 55.85 },
};

/**
 * The config of the runs that slow Chrome's CPU. The floors are the same
 * numbers of ms as an unthrottled run's, and a shift is measured in the ms the
 * throttled run took, so a shift that is below the floor on a normal CPU can
 * reach it. Firefox has no CPU throttle.
 *
 * No throttled A/A run has set these floors; `mode=throttled-aa` produces them.
 *
 * @param preset - The startup preset the run measures.
 */
export function throttledConfig(
  preset: StartupPreset = 'startupStandardHome',
): DetectorConfig {
  return {
    ...DEFAULT_CONFIG,
    browsers: ['chrome'],
    floors: {
      chrome:
        preset === 'startupPowerUserHome'
          ? POWER_USER_CHROME_FLOORS
          : DEFAULT_CONFIG.floors.chrome,
      firefox: DEFAULT_CONFIG.floors.firefox,
    },
  };
}

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
 * @returns The shift of head (B) over base (A) per metric, as a log ratio and in ms of the difference of the means, or undefined when the job is unusable.
 */
export function jobShifts(
  job: JobResult,
  metrics: readonly string[],
  skipSessions: number,
): Record<string, JobShift> | undefined {
  const { sessions, samples } = job;
  if (
    sessions.length < MIN_SESSIONS ||
    sessions.some((session) => !session.success)
  ) {
    return undefined;
  }
  const shifts: Record<string, JobShift> = {};
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
    const logRatio = Math.log(mean(head) / mean(base));
    if (Number.isFinite(logRatio)) {
      shifts[metric] = { logRatio, ms: mean(head) - mean(base) };
    }
  }
  return shifts;
}

export type Level = 'none' | 'quiet' | 'loud';
export type Direction = 'slower' | 'faster';
export type Verdict = { level: Level; direction?: Direction };

/**
 * A shift counts when it reaches the floor, in ms, and its one-sided 95% bound
 * in ms stays on the same side of zero.
 *
 * @param summary - Shift of one metric over a set of jobs.
 * @param floor - The series' floor and loud threshold, in ms.
 */
export function classify(summary: ShiftSummary, floor: SeriesFloor): Verdict {
  const slower = summary.shiftMs >= floor.floorMs && summary.lowerMs > 0;
  const faster = summary.shiftMs <= -floor.floorMs && summary.upperMs < 0;
  if (!slower && !faster) {
    return { level: 'none' };
  }
  return {
    level: Math.abs(summary.shiftMs) >= floor.loudMs ? 'loud' : 'quiet',
    direction: slower ? 'slower' : 'faster',
  };
}

export type MetricScore = { summary?: ShiftSummary; verdict: Verdict };

export type BatchScore = {
  jobsTotal: number;
  jobsUsable: number;
  measurable: boolean;
  shifts: Record<string, JobShift[]>;
  metrics: Record<string, MetricScore>;
};

export function scoreBatch(
  browser: Browser,
  jobs: JobResult[],
  config: DetectorConfig,
): BatchScore {
  const names = [...VERDICT_METRICS, ...BREAKDOWN_METRICS];
  const shifts: Record<string, JobShift[]> = {};
  let jobsUsable = 0;
  for (const job of jobs) {
    const jobResult = jobShifts(job, names, config.skipSessions);
    // A job with no shift for a verdict metric (empty or renamed samples) cannot show a change.
    if (
      !jobResult ||
      VERDICT_METRICS.some((metric) => jobResult[metric] === undefined)
    ) {
      continue;
    }
    jobsUsable += 1;
    for (const [metric, shift] of Object.entries(jobResult)) {
      (shifts[metric] ??= []).push(shift);
    }
  }
  const metrics: Record<string, MetricScore> = {};
  for (const metric of names) {
    const summary = summarizeJobShifts(shifts[metric] ?? []);
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
    shifts,
    metrics,
  };
}

// Holds a score for each browser of the config it was scored with and none for the others.
export type BatchScores = Record<Browser, BatchScore>;

/**
 * @param scores - Scores of one batch.
 * @returns The browsers the batch holds scores for.
 */
export const scoredBrowsers = (scores: BatchScores): Browser[] =>
  BROWSERS.filter((browser) => scores[browser] !== undefined);

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
  return scoredBrowsers(first).some(
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
  for (const browser of config.browsers) {
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
      const pooled = summarizeJobShifts([
        ...first[browser].shifts[metric],
        ...(second[browser].shifts[metric] ?? []),
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
