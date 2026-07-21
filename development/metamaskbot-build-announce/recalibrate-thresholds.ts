#!/usr/bin/env tsx
/**
 * Empirical threshold recalibration query — MetaMask-planning#7252.
 *
 * The `quality-gate` per-metric CI multipliers in `thresholds.ts` were
 * calibrated pre-activation against the variance audit and never reconciled
 * with observed post-activation data (observed FP rate ≈ 0% — over-corrected).
 * This script pulls observed mean/stdDev/p75/p95 per gated metric from the
 * benchmark Sentry logs over a rolling window, computes observed CV the same
 * way the graduation playbook defines it (`avg(stdDev) / avg(mean) * 100`),
 * and prints an audit-vs-observed table with a recommended tier + proposed
 * p75/p95 thresholds. It proposes; a human commits the registry edit.
 *
 * `GATED_METRICS`, `THRESHOLD_REGISTRY`, and `CI_MULTIPLIER` are imported
 * directly so the allowlist and current tiers can never drift from the gate.
 *
 * Sentry surface (from `send-to-sentry.ts`): each CI run emits one structured
 * log `message:<type>.<flow>` with numeric tags `<type>.<stat>.<metricId>`
 * (stat ∈ mean|stdDev|p75|p95) plus `ci.branch` / `ci.persona`. `type` is
 * `benchmark` for startup, `performance` for user journeys, `userAction` for
 * interactions. CLS is emitted as web-vitals spans (not these tags) and is
 * gated on fixed Google thresholds with no multiplier, so it is excluded here.
 *
 * Run: `SENTRY_AUTH_TOKEN=<token> yarn tsx <thisFile>`. Options:
 * `--window 21d` lookback (Sentry statsPeriod); `--branch main` ci.branch
 * filter; `--persona powerUser` extra ci.persona filter (default: intrinsic
 * per flow); `--warn-headroom 1.10` / `--fail-headroom 1.25` proposed =
 * observed × headroom; `--print-queries` emit the API + Logs Explore URLs and
 * exit; `--input file.json` skip the network and compute from saved rows;
 * `--json` also dump raw observed rows. Token scopes: org:read, project:read,
 * event:read (https://sentry.io/settings/account/api/auth-tokens/).
 */

import { parseArgs } from 'util';
import {
  BENCHMARK_TYPE,
  type BenchmarkType,
} from '../../shared/constants/benchmarks';
import { GATED_METRICS } from '../../test/e2e/benchmarks/utils/gated-metrics';
import {
  CI_MULTIPLIER,
  THRESHOLD_REGISTRY,
} from '../../test/e2e/benchmarks/utils/thresholds';

const SENTRY_BASE = 'https://sentry.io/api/0';
const SENTRY_WEB = 'https://metamask.sentry.io';
const ORG = process.env.SENTRY_ORG ?? 'metamask';
// `metamask-benchmark` project (CI benchmark structured logs).
const PROJECT_ID = process.env.SENTRY_BENCHMARK_PROJECT_ID ?? '4510302346608640';
// Sentry "ourlogs" (TraceItem) dataset backing the Logs Explore view.
const DATASET = process.env.SENTRY_LOGS_DATASET ?? 'ourlogs';

// Sentry `type` prefix per benchmark flow; journeys default to performance.
const SENTRY_TYPE_BY_FLOW: Record<string, BenchmarkType> = {
  startupStandardHome: BENCHMARK_TYPE.BENCHMARK,
  startupPowerUserHome: BENCHMARK_TYPE.BENCHMARK,
  loadNewAccount: BENCHMARK_TYPE.USER_ACTION,
  confirmTx: BENCHMARK_TYPE.USER_ACTION,
  bridgeUserActions: BENCHMARK_TYPE.USER_ACTION,
};

// Intrinsic persona for flows whose persona is fixed by the benchmark.
const PERSONA_BY_FLOW: Record<string, string> = {
  startupStandardHome: 'standard',
  startupPowerUserHome: 'powerUser',
};

type GatedTimerMetric = {
  key: string; // `${flow}.${metricId}`
  flow: string;
  metricId: string;
  type: BenchmarkType;
  persona?: string;
  currentMultiplier?: number;
  currentP75?: { warn: number; fail: number };
  currentP95?: { warn: number; fail: number };
};

type ObservedRow = {
  key: string;
  avgMean?: number;
  avgStdDev?: number;
  p75?: number;
  p95?: number;
  count: number;
};

const resolveType = (flow: string): BenchmarkType =>
  SENTRY_TYPE_BY_FLOW[flow] ?? BENCHMARK_TYPE.PERFORMANCE;

// Reverse-lookup a multiplier value to its CI_MULTIPLIER tier name.
const tierName = (value?: number): string => {
  if (value === undefined) {
    return 'unset';
  }
  const match = Object.entries(CI_MULTIPLIER).find(([, v]) => v === value);
  return match ? match[0] : `custom(${value})`;
};

/**
 * Recommend a tier from observed CV. Single empirical table (replaces the
 * audit-derived per-group constants); the powerUser interim collapses into it
 * once outlier trimming brings its CV down.
 *
 * @param cv - Observed coefficient of variation, percent (undefined = no data).
 * @returns The recommended tier name and its multiplier (null when no data).
 */
const recommendTier = (
  cv?: number,
): { name: string; multiplier: number | null } => {
  if (cv === undefined) {
    return { name: 'NO DATA', multiplier: null };
  }
  if (cv > 50) {
    return { name: 'DE-GATE (unreliable)', multiplier: null };
  }
  if (cv < 15) {
    return { name: 'TIER_1', multiplier: CI_MULTIPLIER.TIER_1 };
  }
  if (cv < 25) {
    return { name: 'DEFAULT', multiplier: CI_MULTIPLIER.DEFAULT };
  }
  if (cv < 35) {
    return { name: 'TIER_2', multiplier: CI_MULTIPLIER.TIER_2 };
  }
  return {
    name: 'STARTUP_POWER_USER',
    multiplier: CI_MULTIPLIER.STARTUP_POWER_USER,
  };
};

// Build the per-metric set from the gate's own allowlist + registry.
const collectGatedTimerMetrics = (): {
  timers: GatedTimerMetric[];
  excludedCls: string[];
} => {
  const timers: GatedTimerMetric[] = [];
  const excludedCls: string[] = [];

  for (const key of GATED_METRICS) {
    const dot = key.indexOf('.');
    const flow = key.slice(0, dot);
    const metricId = key.slice(dot + 1);

    // CLS is a web-vitals span metric on fixed Google thresholds (no
    // multiplier) — not part of CV-based multiplier recalibration.
    if (metricId === 'cls') {
      excludedCls.push(key);
      continue;
    }

    const entry = THRESHOLD_REGISTRY[flow]?.[metricId];
    timers.push({
      key,
      flow,
      metricId,
      type: resolveType(flow),
      persona: PERSONA_BY_FLOW[flow],
      currentMultiplier: entry?.ciMultiplier,
      currentP75: entry?.p75,
      currentP95: entry?.p95,
    });
  }
  return { timers, excludedCls };
};

const tag = (type: string, stat: string, metricId: string): string =>
  `${type}.${stat}.${metricId}`;

const buildQueryString = (
  m: GatedTimerMetric,
  branch: string,
  persona?: string,
): string => {
  const parts = [`message:${m.type}.${m.flow}`, `ci.branch:${branch}`];
  const effectivePersona = persona ?? m.persona;
  if (effectivePersona) {
    parts.push(`ci.persona:${effectivePersona}`);
  }
  return parts.join(' ');
};

// Sentry events (logs) API URL returning one aggregate row for a metric.
const buildEventsApiUrl = (
  m: GatedTimerMetric,
  statsPeriod: string,
  branch: string,
  persona?: string,
): string => {
  const params = new URLSearchParams();
  params.set('dataset', DATASET);
  params.set('project', PROJECT_ID);
  params.set('statsPeriod', statsPeriod);
  params.set('per_page', '1');
  for (const stat of ['mean', 'stdDev', 'p75', 'p95'] as const) {
    params.append(
      'field',
      `avg(tags[${tag(m.type, stat, m.metricId)},number])`,
    );
  }
  params.append('field', 'count()');
  params.set('query', buildQueryString(m, branch, persona));
  return `${SENTRY_BASE}/organizations/${ORG}/events/?${params.toString()}`;
};

// Logs Explore deep link for eyeballing a metric's window manually.
const buildLogsExploreUrl = (
  m: GatedTimerMetric,
  statsPeriod: string,
  branch: string,
  persona?: string,
): string => {
  const params = new URLSearchParams();
  params.set('mode', 'aggregate');
  params.set('project', PROJECT_ID);
  params.set('statsPeriod', statsPeriod);
  for (const stat of ['mean', 'stdDev', 'p75', 'p95'] as const) {
    params.append(
      'aggregateField',
      JSON.stringify({
        yAxes: [`avg(tags[${tag(m.type, stat, m.metricId)},number])`],
      }),
    );
  }
  params.set('logsQuery', buildQueryString(m, branch, persona));
  return `${SENTRY_WEB}/explore/logs/?${params.toString()}`;
};

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const fetchObserved = async (
  m: GatedTimerMetric,
  token: string,
  statsPeriod: string,
  branch: string,
  persona: string | undefined,
): Promise<ObservedRow> => {
  const url = buildEventsApiUrl(m, statsPeriod, branch, persona);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `Sentry ${res.status} for ${m.key}: ${res.statusText}. ` +
        `If this is a dataset error, the logs dataset name may differ — ` +
        `set SENTRY_LOGS_DATASET or use --print-queries + the Logs Explore URL.`,
    );
  }
  const body = (await res.json()) as { data?: Record<string, unknown>[] };
  const row = body.data?.[0] ?? {};
  return {
    key: m.key,
    avgMean: num(row[`avg(tags[${tag(m.type, 'mean', m.metricId)},number])`]),
    avgStdDev: num(
      row[`avg(tags[${tag(m.type, 'stdDev', m.metricId)},number])`],
    ),
    p75: num(row[`avg(tags[${tag(m.type, 'p75', m.metricId)},number])`]),
    p95: num(row[`avg(tags[${tag(m.type, 'p95', m.metricId)},number])`]),
    count: num(row['count()']) ?? 0,
  };
};

const cvOf = (row: ObservedRow): number | undefined =>
  row.avgMean !== undefined && row.avgStdDev !== undefined && row.avgMean > 0
    ? (row.avgStdDev / row.avgMean) * 100
    : undefined;

const fmt = (v?: number, digits = 0): string =>
  v === undefined ? '—' : v.toFixed(digits);

const wf = (t?: { warn: number; fail: number }): string =>
  t ? `${t.warn}/${t.fail}` : '—';

const propose = (
  observed: number | undefined,
  warnHeadroom: number,
  failHeadroom: number,
): string =>
  observed === undefined
    ? '—'
    : `${Math.round(observed * warnHeadroom)}/${Math.round(observed * failHeadroom)}`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      window: { type: 'string', default: '21d' },
      branch: { type: 'string', default: 'main' },
      persona: { type: 'string' },
      'warn-headroom': { type: 'string', default: '1.10' },
      'fail-headroom': { type: 'string', default: '1.25' },
      'print-queries': { type: 'boolean', default: false },
      input: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  });

  const statsPeriod = values.window as string;
  const branch = values.branch as string;
  const persona = values.persona as string | undefined;
  const warnHeadroom = Number(values['warn-headroom']);
  const failHeadroom = Number(values['fail-headroom']);

  const { timers, excludedCls } = collectGatedTimerMetrics();

  if (values['print-queries']) {
    for (const m of timers) {
      console.log(`\n## ${m.key}  (type=${m.type})`);
      console.log(`API:  ${buildEventsApiUrl(m, statsPeriod, branch, persona)}`);
      console.log(
        `Logs: ${buildLogsExploreUrl(m, statsPeriod, branch, persona)}`,
      );
    }
    return;
  }

  let rows: ObservedRow[];
  if (values.input) {
    const fs = await import('fs');
    rows = JSON.parse(
      fs.readFileSync(values.input as string, 'utf8'),
    ) as ObservedRow[];
  } else {
    const token = process.env.SENTRY_AUTH_TOKEN;
    if (!token) {
      throw new Error(
        'SENTRY_AUTH_TOKEN not set. Create one at ' +
          'https://sentry.io/settings/account/api/auth-tokens/ (org:read, ' +
          'project:read, event:read), or run with --print-queries / --input.',
      );
    }
    rows = [];
    for (const m of timers) {
      // Sequential to stay polite to the API; the gated set is small (~15).
      rows.push(await fetchObserved(m, token, statsPeriod, branch, persona));
    }
  }

  if (values.json) {
    console.log(JSON.stringify(rows, null, 2));
  }

  const rowByKey = new Map(rows.map((r) => [r.key, r]));
  const now = new Date().toISOString().slice(0, 10);
  const personaNote = persona ? ` · persona: \`${persona}\`` : '';

  console.log(
    `\n# Threshold recalibration — observed vs. current (planning 7252)\n\n` +
      `Window: \`${statsPeriod}\` · branch: \`${branch}\`${personaNote} · ` +
      `generated: ${now}\n\n` +
      `CV = avg(stdDev)/avg(mean)×100 over the window (graduation-playbook ` +
      `definition). Recommended tier and proposed thresholds are proposals — ` +
      `confirm before editing \`thresholds.ts\`.\n`,
  );

  console.log(`## Multiplier tiers\n`);
  console.log(
    `| Metric | Type | Current tier (×) | Obs. CV% | Samples | Recommended (×) | Δ |\n` +
      `|---|---|---|---:|---:|---|:-:|`,
  );
  for (const m of timers) {
    const row = rowByKey.get(m.key);
    const cv = row ? cvOf(row) : undefined;
    const rec = recommendTier(cv);
    const curName = tierName(m.currentMultiplier);
    const changed =
      rec.multiplier !== null && rec.multiplier !== m.currentMultiplier;
    const recMult = rec.multiplier === null ? '' : ` (${rec.multiplier.toFixed(2)})`;
    console.log(
      `| \`${m.key}\` | ${m.type} | ${curName} (${fmt(m.currentMultiplier, 2)}) | ` +
        `${fmt(cv, 1)} | ${row?.count ?? 0} | ${rec.name}${recMult} | ` +
        `${changed ? '⚠️' : '✓'} |`,
    );
  }

  console.log(`\n## Base thresholds (warn/fail)\n`);
  console.log(
    `Proposed = observed × warn ${warnHeadroom} / fail ${failHeadroom}.\n`,
  );
  console.log(
    `| Metric | Cur p75 | Obs p75 | Prop p75 | Cur p95 | Obs p95 | Prop p95 |\n` +
      `|---|---|---:|---|---|---:|---|`,
  );
  for (const m of timers) {
    const row = rowByKey.get(m.key);
    console.log(
      `| \`${m.key}\` | ${wf(m.currentP75)} | ${fmt(row?.p75)} | ` +
        `${propose(row?.p75, warnHeadroom, failHeadroom)} | ` +
        `${wf(m.currentP95)} | ${fmt(row?.p95)} | ` +
        `${propose(row?.p95, warnHeadroom, failHeadroom)} |`,
    );
  }

  const noData = timers.filter((m) => {
    const row = rowByKey.get(m.key);
    return !row || row.count === 0 || cvOf(row) === undefined;
  });
  if (noData.length > 0) {
    const list = noData.map((m) => `- \`${m.key}\``).join('\n');
    console.log(
      `\n## ⚠️ No usable samples (gated but no data in window)\n\n${list}\n\n` +
        `Investigate before recalibrating: a gated metric with no samples is ` +
        `either not emitting, renamed, or its baseline is frozen (cf. planning ` +
        `7279). Recalibrating these blind would re-introduce blind spots.`,
    );
  }

  if (excludedCls.length > 0) {
    const list = excludedCls.map((k) => `- \`${k}\``).join('\n');
    console.log(
      `\n## Excluded (CLS canary — fixed Google thresholds, no multiplier)\n\n${list}`,
    );
  }

  console.log(
    `\n---\nNext: forward-test the proposed values against recent main ` +
      `merges, then commit the \`thresholds.ts\` edit. Reused by FN tracking ` +
      `(planning 7254) via --input on saved \`--json\` output.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
