import {
  BREAKDOWN_METRICS,
  BROWSERS,
  VERDICT_METRICS,
  type BatchScores,
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
};

const fmt = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const cell = (summary: ShiftSummary | undefined) =>
  summary
    ? `${fmt(summary.shiftPct)} [${fmt(summary.lowerPct)}, ${fmt(summary.upperPct)}] n=${summary.jobs}`
    : 'n/a';

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
      ? '| Browser | Metric | Head vs base [95% bounds] | Verdict |'
      : '| Browser | Metric | Head vs base [95% bounds] |',
    withVerdict ? '|---|---|---|---|' : '|---|---|---|',
  ];
  for (const browser of BROWSERS) {
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
  `${title}: ${BROWSERS.map(
    (browser) =>
      `${browser} ${scores[browser].jobsUsable}/${scores[browser].jobsTotal} jobs usable`,
  ).join(', ')}`;

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
  const lines = [
    '## Main performance detector',
    '',
    `Head \`${head}\` (${plan.headSubject}) against base \`${plan.baseSha.slice(0, 10)}\`${plan.rangeSize > 1 ? `, a range of ${plan.rangeSize} commits` : ''}.`,
    plan.canary
      ? 'This is an A/A canary: base and head are the same build, so any finding is a false alarm.'
      : '',
    typeof plan.injectMs === 'number'
      ? `Dry run: the head build was slowed by ${plan.injectMs} ms on purpose.`
      : '',
    '',
    `**Result: ${resultLabel(decision, plan, cufs)}**`,
    '',
    `Quiet at a shift of at least ${config.floorPct.chrome}% on Chrome and ${config.floorPct.firefox}% on Firefox with the one-sided 95% bound on the same side of zero, confirmed by a second batch; loud from ${config.loudPct}%.`,
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
