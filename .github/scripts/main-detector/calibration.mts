// origin: ai-synthesis
/**
 * Weekly check of the detector's floors against its own A/A canaries. The
 * detector runs about 1 in 10 main commits against itself (base and head are
 * the same build), so every canary result is a run where any ping, and any
 * shift, is noise. This reads a week of those results and says whether the
 * floors still sit above the noise they were set against. It runs no benchmark.
 */
import type { AnyBlock } from '@slack/types';
import type { CufResult } from './cufs.mts';
import type { PlanInfo } from './report.mts';
import {
  BROWSERS,
  DEFAULT_CONFIG,
  VERDICT_METRICS,
  type BatchScores,
  type Browser,
  type Decision,
  type DetectorConfig,
} from './score.mts';
import type { SlackPayload } from './slack.mts';

/** What `score-cli.mts` writes to `result.json`. */
export type DetectorResult = {
  plan: PlanInfo;
  first: BatchScores;
  second?: BatchScores;
  decision: Decision;
  cufs?: CufResult;
};

// The rules' one-sided 95% bounds are their level: a rule that found nothing
// real fires on about 1 run in 20. The weekly check pings when more canaries
// ping than that allows, so it does not ask for a rate the rules never claimed.
export const ASSUMED_FALSE_PING_RATE = 0.05;
// A tail probability below this counts as more false pings than assumed.
const SIGNIFICANCE = 0.05;

/**
 * @param n - Trials.
 * @param k - Successes at least.
 * @param p - Probability of a success per trial.
 * @returns The probability of `k` or more successes in `n` trials.
 */
export function binomialTail(n: number, k: number, p: number): number {
  let tail = 0;
  let term = (1 - p) ** n;
  for (let i = 0; i <= n; i++) {
    if (i >= k) {
      tail += term;
    }
    term *= ((n - i) / (i + 1)) * (p / (1 - p));
  }
  return Math.min(1, tail);
}

export type StartupNoise = {
  browser: Browser;
  metric: string;
  floorMs: number;
  // Root mean square, over the canaries, of the standard error of the first
  // batch's mean shift in ms: what the floor is applied to.
  noiseMs: number;
  canaries: number;
  floorBelowNoise: boolean;
};

export type CufNoise = {
  series: string;
  deltaBlockMs: number;
  canaries: number;
  // Canaries where the series' lower bound exceeded δ_block.
  falseFindings: number;
  // Root mean square of the series' shift over the canaries, in ms.
  noiseMs: number;
  deltaBlockBelowNoise: boolean;
};

export type CalibrationReport = {
  canaries: number;
  // Canary results written before ms scoring, which this cannot read.
  skipped: number;
  falsePings: number;
  assumedRate: number;
  // Probability of this many false pings or more if the rate were the assumed one.
  tailProbability: number;
  startup: StartupNoise[];
  cufs: CufNoise[];
  ping: boolean;
  reasons: string[];
};

const rms = (values: number[]) =>
  Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length);

const isReadable = (result: DetectorResult) =>
  BROWSERS.some((browser) => {
    const summary = result.first[browser]?.metrics?.uiStartup?.summary;
    return typeof summary?.sdMs === 'number';
  });

/**
 * @param results - Results of the week's detector runs; any that is not a canary is ignored.
 * @param config - The floors the canaries were scored against.
 * @param assumedRate - The false ping rate the floors are taken to allow.
 */
export function summarizeCanaries(
  results: DetectorResult[],
  config: DetectorConfig = DEFAULT_CONFIG,
  assumedRate = ASSUMED_FALSE_PING_RATE,
): CalibrationReport {
  const all = results.filter((result) => result.plan.canary);
  const canaries = all.filter(isReadable);
  const falsePings = canaries.filter(
    (result) =>
      result.decision.ping !== 'none' ||
      (result.cufs?.findings.length ?? 0) > 0,
  ).length;
  const tailProbability =
    canaries.length === 0
      ? 1
      : binomialTail(canaries.length, falsePings, assumedRate);

  const startup: StartupNoise[] = [];
  for (const browser of config.browsers) {
    for (const metric of VERDICT_METRICS) {
      const errors = canaries.flatMap((result) => {
        const summary = result.first[browser]?.metrics[metric]?.summary;
        return summary ? [summary.sdMs / Math.sqrt(summary.jobs)] : [];
      });
      if (errors.length === 0) {
        continue;
      }
      const { floorMs } = config.floors[browser][metric];
      const noiseMs = rms(errors);
      startup.push({
        browser,
        metric,
        floorMs,
        noiseMs,
        canaries: errors.length,
        floorBelowNoise: floorMs < noiseMs,
      });
    }
  }

  const bySeries = new Map<
    string,
    { delta: number; shifts: number[]; blocks: number }
  >();
  for (const result of canaries) {
    for (const outcome of result.cufs?.outcomes ?? []) {
      const entry = bySeries.get(outcome.series) ?? {
        delta: outcome.deltaBlockMs,
        shifts: [],
        blocks: 0,
      };
      if (
        outcome.decision?.shift !== null &&
        outcome.decision?.shift !== undefined
      ) {
        entry.shifts.push(outcome.decision.shift);
      }
      entry.blocks += outcome.verdict === 'block' ? 1 : 0;
      bySeries.set(outcome.series, entry);
    }
  }
  const cufs = [...bySeries.entries()].flatMap(([series, entry]): CufNoise[] =>
    entry.shifts.length === 0
      ? []
      : [
          {
            series,
            deltaBlockMs: entry.delta,
            canaries: entry.shifts.length,
            falseFindings: entry.blocks,
            noiseMs: rms(entry.shifts),
            deltaBlockBelowNoise: entry.delta < rms(entry.shifts),
          },
        ],
  );

  const reasons: string[] = [];
  if (canaries.length > 0 && tailProbability < SIGNIFICANCE) {
    reasons.push(
      `${falsePings} of ${canaries.length} canaries pinged, where a rule that fires on 1 run in ${Math.round(1 / assumedRate)} would give that many or more with probability ${tailProbability.toFixed(3)}`,
    );
  }
  for (const entry of startup.filter((item) => item.floorBelowNoise)) {
    reasons.push(
      `${entry.browser} ${entry.metric}: the floor ${entry.floorMs.toFixed(1)} ms is below the noise of a batch's shift, ${entry.noiseMs.toFixed(1)} ms`,
    );
  }
  for (const entry of cufs.filter((item) => item.deltaBlockBelowNoise)) {
    reasons.push(
      `${entry.series}: δ_block ${entry.deltaBlockMs} ms is below the noise of its shift, ${entry.noiseMs.toFixed(1)} ms`,
    );
  }
  return {
    canaries: canaries.length,
    skipped: all.length - canaries.length,
    falsePings,
    assumedRate,
    tailProbability,
    startup,
    cufs,
    ping: reasons.length > 0,
    reasons,
  };
}

const ms = (value: number) => `${value.toFixed(1)} ms`;

/** The step summary of the weekly check. */
export function renderCalibration(
  report: CalibrationReport,
  window: string,
): string {
  const lines = [
    `## Main performance detector calibration (${window})`,
    '',
    report.canaries === 0
      ? `No canary run in the window could be read, so nothing was checked.${report.skipped > 0 ? ` ${report.skipped} canary result${report.skipped === 1 ? ' was' : 's were'} written before ms scoring.` : ''}`
      : `${report.canaries} canary run${report.canaries === 1 ? '' : 's'}, ${report.falsePings} pinged (false positives, since base and head are the same build).${report.skipped > 0 ? ` ${report.skipped} older canary result${report.skipped === 1 ? '' : 's'} could not be read.` : ''}`,
    '',
  ];
  if (report.reasons.length > 0) {
    lines.push(
      '**Ping:**',
      ...report.reasons.map((reason) => `- ${reason}`),
      '',
    );
  }
  if (report.startup.length > 0) {
    lines.push(
      '| Startup series | Floor | Noise of a batch shift | Canaries |',
      '|---|---|---|---|',
      ...report.startup.map(
        (item) =>
          `| ${item.browser} ${item.metric} | ${ms(item.floorMs)} | ${ms(item.noiseMs)}${item.floorBelowNoise ? ' (above the floor)' : ''} | ${item.canaries} |`,
      ),
      '',
    );
  }
  if (report.cufs.length > 0) {
    lines.push(
      '| Critical user flow series | δ_block | Noise of its shift | False findings | Canaries |',
      '|---|---|---|---|---|',
      ...report.cufs.map(
        (item) =>
          `| ${item.series} | ${ms(item.deltaBlockMs)} | ${ms(item.noiseMs)}${item.deltaBlockBelowNoise ? ' (above δ_block)' : ''} | ${item.falseFindings} | ${item.canaries} |`,
      ),
      '',
    );
  }
  return lines.join('\n');
}

/**
 * @param report - A report that pinged.
 * @param window - The days it covers, for the label.
 * @param runUrl - The run that made it.
 */
export function buildCalibrationMessage(
  report: CalibrationReport,
  window: string,
  runUrl: string,
): SlackPayload {
  const section = (text: string): AnyBlock => ({
    type: 'section',
    text: { type: 'mrkdwn', text },
  });
  return {
    text: `Performance detector (calibration, ${window}): ${report.reasons.length} reason${report.reasons.length === 1 ? '' : 's'} to recheck the floors`,
    blocks: [
      section(
        `:warning: *Performance detector (calibration, ${window}): the floors may no longer fit the noise*\n\n${report.canaries} canary runs of the week, where base and head are the same build, ${report.falsePings} pinged.`,
      ),
      section(
        `:mag: *Why*\n${report.reasons.map((reason) => `• ${reason}`).join('\n')}`,
      ),
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `<${runUrl}|View CI Run>` }],
      },
    ],
  };
}
