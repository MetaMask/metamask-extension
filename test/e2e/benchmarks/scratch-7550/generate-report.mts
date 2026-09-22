import { existsSync, readFileSync, writeFileSync } from 'fs';
import type {
  BenchmarkResults,
  WebVitalsSummary,
} from '../../../../shared/constants/benchmarks';

type BenchmarkBundleEntry = BenchmarkResults | { error: string };

type BenchmarkBundle = Record<string, BenchmarkBundleEntry>;

type CliArgs = {
  after: string;
  beforeToken: string;
  beforeSwitch: string;
  afterSha: string;
  beforeTokenSha: string;
  beforeSwitchSha: string;
  out: string;
};

type ScenarioRow = {
  scenario: string;
  harness: string;
  beforeSha: string;
  afterSha: string;
  beforeKey: string;
  afterKey: string;
  beforeBundle: BenchmarkBundle;
  afterBundle: BenchmarkBundle;
  primaryTimer: string;
  primaryDeltaMetric: 'inp' | 'tbt';
};

type QualityAssessment = {
  notes: string[];
  hasInvalidBaseline: boolean;
  hasUnreliableCv: boolean;
  hasMixedDirection: boolean;
};

const POOR_CV_THRESHOLD = 30;
const UNRELIABLE_CV_THRESHOLD = 50;
const INVALID_ACTION_DURATION_MS = 60_000;

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const index = args.indexOf(flag);
    if (index === -1 || !args[index + 1]) {
      throw new Error(`Missing required flag ${flag}`);
    }
    return args[index + 1];
  };
  return {
    after: get('--after'),
    beforeToken: get('--before-token'),
    beforeSwitch: get('--before-switch'),
    afterSha: get('--after-sha'),
    beforeTokenSha: get('--before-token-sha'),
    beforeSwitchSha: get('--before-switch-sha'),
    out: get('--out'),
  };
}

function loadBundle(path: string): BenchmarkBundle {
  if (!existsSync(path)) {
    console.warn(`Benchmark artifact missing (report will show n/a): ${path}`);
    return {};
  }
  return JSON.parse(readFileSync(path, 'utf8')) as BenchmarkBundle;
}

function isBenchmarkError(
  entry: BenchmarkBundleEntry | undefined,
): entry is { error: string } {
  return (
    entry !== undefined &&
    typeof entry === 'object' &&
    'error' in entry &&
    typeof entry.error === 'string'
  );
}

function getBenchmarkError(
  bundle: BenchmarkBundle,
  registryKey: string,
): string | undefined {
  const entry = bundle[registryKey];
  return isBenchmarkError(entry) ? entry.error : undefined;
}

function getBenchmarkResult(
  bundle: BenchmarkBundle,
  registryKey: string,
): BenchmarkResults | undefined {
  const result = bundle[registryKey];
  return result && !isBenchmarkError(result) ? result : undefined;
}

function getTimerCv(
  result: BenchmarkResults,
  timerId: string,
): number | undefined {
  const mean = result.mean[timerId];
  const stdDev = result.stdDev[timerId];
  return mean !== undefined && mean > 0 && stdDev !== undefined
    ? (stdDev / mean) * 100
    : undefined;
}

function formatCv(cv: number | undefined): string {
  return cv === undefined ? '' : ` (CV ${Math.round(cv)}%)`;
}

function formatMetric(
  bundle: BenchmarkBundle,
  registryKey: string,
  timerId: string,
  webVitals?: WebVitalsSummary,
): string {
  const result = bundle[registryKey];
  if (!result) {
    return 'n/a';
  }
  if (isBenchmarkError(result)) {
    return 'harness error';
  }
  const actionP75 = result.p75[timerId];
  const longTaskMax = result.p75.longTaskMaxDuration;
  const tbt = result.p75.tbt;
  const inp = webVitals?.aggregated.inp?.p75 ?? result.webVitals?.aggregated.inp?.p75;
  const parts: string[] = [];
  if (inp !== undefined && inp !== null) {
    parts.push(
      `INP p75 ${Math.round(inp)}ms${formatCv(webVitals?.aggregated.inp?.cv)}`,
    );
  }
  if (actionP75 !== undefined) {
    parts.push(
      `action p75 ${Math.round(actionP75)}ms${formatCv(
        getTimerCv(result, timerId),
      )}`,
    );
  }
  if (longTaskMax !== undefined) {
    parts.push(
      `longTaskMax p75 ${Math.round(longTaskMax)}ms${formatCv(
        getTimerCv(result, 'longTaskMaxDuration'),
      )}`,
    );
  }
  if (tbt !== undefined) {
    parts.push(
      `TBT p75 ${Math.round(tbt)}ms${formatCv(getTimerCv(result, 'tbt'))}`,
    );
  }
  return parts.length > 0 ? parts.join(' · ') : 'n/a';
}

function getMetricValue(
  result: BenchmarkResults,
  timerId: string,
  metric: ScenarioRow['primaryDeltaMetric'],
): number | undefined {
  if (metric === 'inp') {
    return result.webVitals?.aggregated.inp?.p75 ?? undefined;
  }
  return result.p75[timerId];
}

function formatDelta(row: ScenarioRow): string {
  const before = getBenchmarkResult(row.beforeBundle, row.beforeKey);
  const after = getBenchmarkResult(row.afterBundle, row.afterKey);
  if (!before || !after) {
    return 'n/a';
  }

  const timerId =
    row.primaryDeltaMetric === 'tbt' ? 'tbt' : row.primaryTimer;
  const beforeValue = getMetricValue(
    before,
    timerId,
    row.primaryDeltaMetric,
  );
  const afterValue = getMetricValue(after, timerId, row.primaryDeltaMetric);
  if (beforeValue === undefined || afterValue === undefined) {
    return 'see notes';
  }

  const delta = Math.round(afterValue - beforeValue);
  const sign = delta > 0 ? '+' : '';
  const percent =
    beforeValue > 0
      ? ` (${sign}${Math.round((delta / beforeValue) * 100)}%)`
      : '';
  return `${sign}${delta}ms ${row.primaryDeltaMetric.toUpperCase()}${percent}`;
}

function assessQuality(row: ScenarioRow): QualityAssessment {
  const notes: string[] = [];
  const before = getBenchmarkResult(row.beforeBundle, row.beforeKey);
  const after = getBenchmarkResult(row.afterBundle, row.afterKey);
  if (!before || !after) {
    return {
      notes,
      hasInvalidBaseline: false,
      hasUnreliableCv: false,
      hasMixedDirection: false,
    };
  }

  const hasInvalidBaseline =
    before.p75[row.primaryTimer] >= INVALID_ACTION_DURATION_MS;
  if (hasInvalidBaseline) {
    notes.push('invalid baseline: action timer ≥60s');
  }

  const cvMetrics = [
    ['before INP', before.webVitals?.aggregated.inp?.cv],
    ['before action', getTimerCv(before, row.primaryTimer)],
    ['before longTaskMax', getTimerCv(before, 'longTaskMaxDuration')],
    ['before TBT', getTimerCv(before, 'tbt')],
    ['after INP', after.webVitals?.aggregated.inp?.cv],
    ['after action', getTimerCv(after, row.primaryTimer)],
    ['after longTaskMax', getTimerCv(after, 'longTaskMaxDuration')],
    ['after TBT', getTimerCv(after, 'tbt')],
  ] as const;
  const highCv = cvMetrics
    .filter(([, cv]) => cv !== undefined && cv >= POOR_CV_THRESHOLD)
    .map(([label, cv]) => `${label} ${Math.round(cv ?? 0)}%`);
  if (highCv.length > 0) {
    notes.push(`high CV: ${highCv.join(', ')}`);
  }
  const hasUnreliableCv = cvMetrics.some(
    ([, cv]) => cv !== undefined && cv >= UNRELIABLE_CV_THRESHOLD,
  );

  // Token search: end-to-end action time includes list filtering (#7475 guidance
  // is INP / long tasks / TBT). Do not treat action duration as evidence.
  const metricPairs =
    row.beforeKey === 'tokenSearchPowerUser'
      ? [
          [
            before.webVitals?.aggregated.inp?.p75,
            after.webVitals?.aggregated.inp?.p75,
          ],
          [before.p75.longTaskMaxDuration, after.p75.longTaskMaxDuration],
          [before.p75.tbt, after.p75.tbt],
        ]
      : [
          [
            before.webVitals?.aggregated.inp?.p75,
            after.webVitals?.aggregated.inp?.p75,
          ],
          [before.p75[row.primaryTimer], after.p75[row.primaryTimer]],
          [before.p75.longTaskMaxDuration, after.p75.longTaskMaxDuration],
          [before.p75.tbt, after.p75.tbt],
        ];
  const deltas = metricPairs
    .filter(
      (pair): pair is [number, number] =>
        pair[0] !== undefined && pair[1] !== undefined,
    )
    .map(([beforeValue, afterValue]) => afterValue - beforeValue)
    .filter((delta) => delta !== 0);
  const hasMixedDirection =
    deltas.some((delta) => delta < 0) &&
    deltas.some((delta) => delta > 0);
  if (hasMixedDirection) {
    notes.push('mixed direction across INP/action/long-task metrics');
  }

  return {
    notes,
    hasInvalidBaseline,
    hasUnreliableCv,
    hasMixedDirection,
  };
}

function formatNotes(...messages: Array<string | undefined>): string {
  const filtered = messages.filter(
    (message): message is string => Boolean(message),
  );
  if (filtered.length === 0) {
    return '';
  }
  return filtered
    .map((message) => message.replace(/^Error:\s*/u, '').replace(/\|/gu, '\\|'))
    .join(' · ')
    .slice(0, 500);
}

function buildRow(row: ScenarioRow): string {
  const beforeError = getBenchmarkError(row.beforeBundle, row.beforeKey);
  const afterError = getBenchmarkError(row.afterBundle, row.afterKey);
  const before = formatMetric(
    row.beforeBundle,
    row.beforeKey,
    row.primaryTimer,
    isBenchmarkError(row.beforeBundle[row.beforeKey])
      ? undefined
      : row.beforeBundle[row.beforeKey]?.webVitals,
  );
  const after = formatMetric(
    row.afterBundle,
    row.afterKey,
    row.primaryTimer,
    isBenchmarkError(row.afterBundle[row.afterKey])
      ? undefined
      : row.afterBundle[row.afterKey]?.webVitals,
  );
  const beforeCell = `${before} @ \`${row.beforeSha.slice(0, 7)}\``;
  const afterCell = `${after} @ \`${row.afterSha.slice(0, 7)}\``;
  const quality = assessQuality(row);
  const delta =
    quality.hasInvalidBaseline ||
    quality.hasMixedDirection ||
    quality.hasUnreliableCv
      ? 'not reportable'
      : formatDelta(row);
  const statusBase =
    beforeError || afterError || before === 'n/a' || after === 'n/a'
      ? 'failed'
      : 'done';
  const status =
    statusBase === 'failed'
      ? statusBase
      : quality.hasInvalidBaseline
        ? 'invalid'
        : quality.hasUnreliableCv
          ? 'unreliable'
          : quality.hasMixedDirection
            ? 'mixed'
            : statusBase;
  const notes = formatNotes(beforeError, afterError, ...quality.notes);
  return `| ${row.scenario} | ${row.harness} | ${beforeCell} | ${afterCell} | ${delta} | ${status} | ${notes} |`;
}

function main(): void {
  const cli = parseArgs();
  const afterBundle = loadBundle(cli.after);
  const beforeTokenBundle = loadBundle(cli.beforeToken);
  const beforeSwitchBundle = loadBundle(cli.beforeSwitch);

  const rows: ScenarioRow[] = [
    {
      scenario: 'Token search (1000+ tokens)',
      harness: 'token-search-power-user USER_ACTION',
      beforeSha: cli.beforeTokenSha,
      afterSha: cli.afterSha,
      beforeKey: 'tokenSearchPowerUser',
      afterKey: 'tokenSearchPowerUser',
      beforeBundle: beforeTokenBundle,
      afterBundle,
      primaryTimer: 'token_search_power_user',
      primaryDeltaMetric: 'tbt',
    },
    {
      scenario: 'Account switching',
      harness: 'account-switch USER_ACTION',
      beforeSha: cli.beforeSwitchSha,
      afterSha: cli.afterSha,
      beforeKey: 'accountSwitch',
      afterKey: 'accountSwitch',
      beforeBundle: beforeSwitchBundle,
      afterBundle,
      primaryTimer: 'account_switch',
      primaryDeltaMetric: 'inp',
    },
    {
      scenario: 'Network switching',
      harness: 'network-switch USER_ACTION',
      beforeSha: cli.beforeSwitchSha,
      afterSha: cli.afterSha,
      beforeKey: 'networkSwitch',
      afterKey: 'networkSwitch',
      beforeBundle: beforeSwitchBundle,
      afterBundle,
      primaryTimer: 'network_switch',
      primaryDeltaMetric: 'inp',
    },
  ];

  const header = `## Scenario measurement (#6657)

| Scenario | New e2e (#7550) | Before (value @ SHA) | After (value @ SHA) | Δ | Status | Notes |
|----------|-----------------|----------------------|---------------------|---|--------|-------|
`;

  const body = rows.map(buildRow).join('\n');
  const footer = `

Token search uses TBT as its primary delta; switch scenarios use INP. CV ≥30% is
flagged, CV ≥50% is unreliable, and mixed-direction rows are not evidence of an
improvement.

### SHAs

- After (current): \`${cli.afterSha}\`
- Before token search (pre-#7475 / extension#44443): \`${cli.beforeTokenSha}\`
- Before account/network (pre-#7476 / extension#45265): \`${cli.beforeSwitchSha}\`
`;

  writeFileSync(cli.out, `${header}${body}${footer}`);
  console.log(`Wrote ${cli.out}`);
}

main();
