import {
  BREAKDOWN_METRICS,
  DEFAULT_CONFIG,
  VERDICT_METRICS,
  scoredBrowsers,
  throttledConfig,
  type BatchScores,
  type StartupPreset,
  type Decision,
  type DetectorConfig,
  type Verdict,
} from './score.mts';
import type { ShiftSummary } from './stats.mts';
import { renderCufSummary, type CufResult } from './cufs.mts';

export type PlanInfo = {
  headSha: string;
  headSubject: string;
  baseSha: string;
  // True when base and head are the same build, run as a false-alarm canary.
  canary: boolean;
  // Dry run only: milliseconds of busy-wait added to the head build.
  injectMs?: number | null;
  // Number of commits between the base (exclusive) and the head (inclusive).
  rangeSize: number;
  // Set by the runs that slow Chrome's CPU: how many times slower it ran.
  cpuThrottleRate?: number;
  // Which of those runs it is, `daily` when unset.
  kind?: 'daily' | 'power-user' | 'drift';
  // The startup preset a throttled run measured, the standard home when unset.
  preset?: StartupPreset;
};

/**
 * @param plan - What was compared.
 * @returns The label of a throttled run, which names the range it covers:
 * `throttled, <base>..<head>`, `throttled power-user, <base>..<head>` or, for
 * the comparison with the pinned reference build, `drift, <base>..<head>`.
 * `undefined` for a commit check.
 */
export function planLabel(plan: PlanInfo): string | undefined {
  if (plan.cpuThrottleRate === undefined) {
    return undefined;
  }
  const range = `${plan.baseSha.slice(0, 7)}..${plan.headSha.slice(0, 7)}`;
  const names = {
    daily: 'throttled',
    'power-user': 'throttled power-user',
    drift: 'drift',
  };
  return `${names[plan.kind ?? 'daily']}, ${range}`;
}

/** The config a plan is scored with: Chrome only, with its own medians when throttled. */
export const planConfig = (plan: PlanInfo): DetectorConfig =>
  plan.cpuThrottleRate === undefined
    ? DEFAULT_CONFIG
    : throttledConfig(plan.preset);

/** The name prefix of the plan's artifacts, apart from the commit checks' and each other's. */
export const planPrefix = (plan: PlanInfo): string => {
  if (plan.cpuThrottleRate === undefined) {
    return 'detector';
  }
  return {
    daily: 'throttled',
    'power-user': 'throttled-power-user',
    drift: 'drift',
  }[plan.kind ?? 'daily'];
};

const fmt = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const fmtMs = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;

// The measured shift in ms with its bounds, then the percent for reference.
const cell = (summary: ShiftSummary | undefined) =>
  summary
    ? `${fmtMs(summary.shiftMs)} ms [${fmtMs(summary.lowerMs)}, ${fmtMs(summary.upperMs)}] n=${summary.jobs} (${fmt(summary.shiftPct)} [${fmt(summary.lowerPct)}, ${fmt(summary.upperPct)}])`
    : 'n/a';

const floorsText = (config: DetectorConfig, key: 'floorMs' | 'loudMs') =>
  config.browsers
    .flatMap((browser) =>
      VERDICT_METRICS.map(
        (metric) =>
          `${(config.floors[browser][metric][key] + 1e-9).toFixed(1)} ms ${browser} ${metric}`,
      ),
    )
    .join(', ');

const verdictCell = (verdict: Verdict) =>
  verdict.level === 'none' ? '' : `${verdict.level} ${verdict.direction}`;

function batchTable(
  title: string,
  scores: BatchScores,
  metrics: readonly string[],
  withVerdict: boolean,
): string[] {
  const lines = [
    `#### ${title}`,
    '',
    withVerdict
      ? '| Browser | Metric | Head minus base [95% bounds] (percent) | Verdict |'
      : '| Browser | Metric | Head minus base [95% bounds] (percent) |',
    withVerdict ? '|---|---|---|---|' : '|---|---|---|',
  ];
  for (const browser of scoredBrowsers(scores)) {
    for (const metric of metrics) {
      const score = scores[browser].metrics[metric];
      const row = `| ${browser} | ${metric} | ${cell(score.summary)}`;
      lines.push(
        withVerdict ? `${row} | ${verdictCell(score.verdict)} |` : `${row} |`,
      );
    }
  }
  return [...lines, ''];
}

const jobsLine = (title: string, scores: BatchScores) =>
  `${title}: ${scoredBrowsers(scores)
    .map(
      (browser) =>
        `${browser} ${scores[browser].jobsUsable}/${scores[browser].jobsTotal} jobs usable`,
    )
    .join(', ')}`;

export function renderSummary(options: {
  plan: PlanInfo;
  first: BatchScores;
  second?: BatchScores;
  decision: Decision;
  config: DetectorConfig;
  cufs?: CufResult;
}): string {
  const { plan, first, second, decision, config, cufs } = options;
  const head = plan.headSha.slice(0, 10);
  const label = planLabel(plan);
  const lines = [
    label
      ? `## Main performance detector (${label})`
      : '## Main performance detector',
    '',
    `Head \`${head}\` (${plan.headSubject}) against base \`${plan.baseSha.slice(0, 10)}\`${plan.rangeSize > 1 ? `, a range of ${plan.rangeSize} commits` : ''}.`,
    plan.cpuThrottleRate === undefined
      ? ''
      : `Chrome's CPU was slowed ${plan.cpuThrottleRate} times for both builds, so every ms below is a throttled ms.`,
    plan.canary
      ? 'This is an A/A canary: base and head are the same build, so any finding is a false alarm.'
      : '',
    typeof plan.injectMs === 'number'
      ? `Dry run: the head build was slowed by ${plan.injectMs} ms on purpose.`
      : '',
    '',
    `**Result: ${resultLabel(decision, plan, cufs)}**`,
    '',
    `Quiet at a shift of at least ${floorsText(config, 'floorMs')} with the one-sided 95% bound on the same side of zero, confirmed by a second batch; loud from ${floorsText(config, 'loudMs')}.`,
    '',
  ];

  if (decision.findings.length > 0) {
    lines.push(
      '| Browser | Metric | Direction | First batch | Second batch | Pooled |',
      '|---|---|---|---|---|---|',
      ...decision.findings.map(
        (finding) =>
          `| ${finding.browser} | ${finding.metric} | ${finding.level} ${finding.direction} | ${cell(finding.first)} | ${cell(finding.second)} | ${cell(finding.pooled)} |`,
      ),
      '',
    );
  }
  if (decision.unmeasured.length > 0) {
    lines.push(
      `Could not measure: ${decision.unmeasured.join(', ')} (too few usable jobs in a batch).`,
      '',
    );
  }

  lines.push(jobsLine('First batch', first));
  if (second) {
    lines.push(jobsLine('Confirmation batch', second));
  }
  lines.push(
    '',
    ...batchTable('First batch', first, VERDICT_METRICS, true),
    ...(second
      ? batchTable('Confirmation batch', second, VERDICT_METRICS, true)
      : []),
    ...batchTable(
      'Where it comes from (first batch)',
      first,
      BREAKDOWN_METRICS,
      false,
    ),
    ...(cufs ? renderCufSummary(cufs) : []),
  );
  return lines.join('\n');
}

// origin: ai-reviewed
/**
 * @param decision - The startup decision.
 * @param plan - What was compared.
 * @param cufs - The critical user flows' result, when they ran.
 */
export function resultLabel(
  decision: Decision,
  plan: PlanInfo,
  cufs?: CufResult,
): string {
  const startup = startupLabel(decision, plan);
  const parts: string[] = [];
  if (cufs && cufs.findings.length > 0) {
    parts.push(
      `critical user flow slower${plan.canary ? ' (false alarm: canary)' : ''}: ${cufs.findings.join(', ')}`,
    );
  }
  if (cufs && cufs.unmeasured.length > 0) {
    parts.push(
      `could not measure critical user flows: ${cufs.unmeasured.join(', ')}`,
    );
  }
  if (parts.length === 0) {
    return startup;
  }
  return startup === 'no change detected'
    ? parts.join('; ')
    : [startup, ...parts].join('; ');
}

function startupLabel(decision: Decision, plan: PlanInfo): string {
  if (decision.ping !== 'none') {
    const metrics = [
      ...new Set(
        decision.findings.map(
          (finding) =>
            `${finding.browser} ${finding.metric} ${finding.direction}`,
        ),
      ),
    ].join(', ');
    return `${decision.ping} ping${plan.canary ? ' (false alarm: canary)' : ''}: ${metrics}`;
  }
  return decision.unmeasured.length > 0
    ? 'could not measure'
    : 'no change detected';
}
