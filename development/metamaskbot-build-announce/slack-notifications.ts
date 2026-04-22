/**
 * Slack notification module for performance benchmark regressions.
 *
 * Posts via MetaMask Bot (same @slack/webhook pattern as
 * .github/scripts/post-nightly-builds.ts).
 *
 * Phases: 2 (fail verdict alert), 3 (weekly digest), 4 (baseline-reset alert)
 *
 * Channel: #extension-performance-alerts (bound to the webhook)
 *
 * Batching: regressions within a 1-hour window are accumulated into
 * a single message, unless a regression is severe (>50% delta or
 * >2x the fail threshold).
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { IncomingWebhook } from '@slack/webhook';
import type {
  ThresholdViolation,
  ThresholdConfig,
} from '../../shared/constants/benchmarks';
import { THRESHOLD_SEVERITY } from '../../shared/constants/benchmarks';
import type { BenchmarkEntryComparison } from './comparison-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SlackContext = {
  /** Slack incoming-webhook URL (from CI secret SLACK_BENCHMARK_WEBHOOK_URL) */
  webhookUrl: string;
  /** PR number, if available */
  prNumber?: string;
  /** PR author GitHub handle */
  prAuthor?: string;
  /** GitHub Actions run URL */
  ciRunUrl?: string;
  /** PR URL */
  prUrl?: string;
};

type OwnershipMap = Record<string, string>;

type BatchEntry = {
  comparison: BenchmarkEntryComparison;
  violation: ThresholdViolation;
  timestamp: number;
};

type SlackBlock = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERE_DELTA_THRESHOLD = 0.5; // 50% regression
const SEVERE_FAIL_MULTIPLIER = 2.0; // >2x the fail threshold

const BATCH_WINDOW_MS = 60 * 60 * 1000; // 1 hour

let batchDirPromise: Promise<string> | null = null;
let batchFilePathPromise: Promise<string> | null = null;

async function getBatchFilePath(): Promise<string> {
  if (!batchDirPromise) {
    batchDirPromise = fs
      .mkdtemp(path.join(os.tmpdir(), 'benchmark-slack-batch-'))
      .then(async (dir) => {
        await fs.chmod(dir, 0o700);
        return dir;
      });
  }

  if (!batchFilePathPromise) {
    batchFilePathPromise = batchDirPromise.then((dir) =>
      path.join(dir, 'batch.json'),
    );
  }

  return await batchFilePathPromise;
}

// ---------------------------------------------------------------------------
// Ownership config (Phase 2 fallback to PR author; Phase 4 uses #6841 map)
// ---------------------------------------------------------------------------

let ownershipCache: OwnershipMap | null = null;

/**
 * Loads benchmark -> team mapping from the ownership config file.
 * Returns an empty map if the file does not exist yet (#6841 not landed).
 *
 * @param configPath - Optional path to the ownership JSON file.
 */
export async function loadOwnershipMap(
  configPath?: string,
): Promise<OwnershipMap> {
  if (ownershipCache) {
    return ownershipCache;
  }

  const resolved =
    configPath ??
    path.resolve(
      __dirname,
      '../../test/e2e/benchmarks/benchmark-ownership.json',
    );

  try {
    const raw = await fs.readFile(resolved, 'utf-8');
    ownershipCache = JSON.parse(raw) as OwnershipMap;
  } catch {
    // Ownership config not yet available — fall back to PR author
    ownershipCache = {};
  }
  return ownershipCache;
}

/**
 * Resolves a Slack mention for a benchmark.
 * Uses ownership map if available, otherwise falls back to PR author.
 *
 * @param benchmarkName - The benchmark entry name to look up.
 * @param ownership - Map of benchmark name to Slack group ID or handle.
 * @param prAuthor - PR author GitHub handle, used as fallback.
 */
export function resolveTeamMention(
  benchmarkName: string,
  ownership: OwnershipMap,
  prAuthor?: string,
): string {
  const team = ownership[benchmarkName];
  if (team) {
    // Slack user group mention: <!subteam^ID|@handle>
    // If it looks like a Slack group ID, wrap it; otherwise treat as @mention
    if (team.startsWith('S')) {
      return `<!subteam^${team}>`;
    }
    return `@${team}`;
  }
  return prAuthor ? `@${prAuthor}` : 'unknown author';
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when a regression is severe enough to bypass batching:
 * - Delta exceeds 50%, OR
 * - Value exceeds 2x the fail threshold
 *
 * @param violation - The threshold violation to evaluate.
 * @param thresholdConfig - Optional threshold config used for delta calculation.
 */
export function isSevereRegression(
  violation: ThresholdViolation,
  thresholdConfig?: ThresholdConfig,
): boolean {
  // Check if value exceeds 2x the fail threshold
  if (violation.value > violation.threshold * SEVERE_FAIL_MULTIPLIER) {
    return true;
  }

  // Check delta percentage (need threshold to compute)
  if (thresholdConfig) {
    const metricConfig = thresholdConfig[violation.metricId];
    if (metricConfig) {
      const pKey = violation.percentile;
      const limits = metricConfig[pKey];
      if (limits) {
        const failLimit = limits.fail * (metricConfig.ciMultiplier ?? 1);
        const delta = (violation.value - failLimit) / failLimit;
        if (delta > SEVERE_DELTA_THRESHOLD) {
          return true;
        }
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Block helpers (rich_text format matching post-nightly-builds.ts)
// ---------------------------------------------------------------------------

function richTextSection(
  elements: Record<string, unknown>[],
): Record<string, unknown> {
  return {
    type: 'rich_text',
    elements: [{ type: 'rich_text_section', elements }],
  };
}

function textEl(
  text: string,
  style?: { bold?: boolean; italic?: boolean; code?: boolean },
): Record<string, unknown> {
  return style ? { type: 'text', text, style } : { type: 'text', text };
}

function linkEl(url: string, text: string): Record<string, unknown> {
  return { type: 'link', url, text };
}

function emojiEl(name: string): Record<string, unknown> {
  return { type: 'emoji', name };
}

function divider(): Record<string, unknown> {
  return { type: 'divider' };
}

// ---------------------------------------------------------------------------
// Phase 2 — Fail verdict notification
// ---------------------------------------------------------------------------

export type FailVerdictPayload = {
  comparisons: BenchmarkEntryComparison[];
  context: SlackContext;
  ownership: OwnershipMap;
};

/**
 * Builds Slack Block Kit payload for a fail verdict.
 * Uses rich_text blocks for consistency with MetaMask Bot messages.
 *
 * @param payload - Benchmark comparisons, Slack context, and ownership map.
 */
export function formatFailVerdict(payload: FailVerdictPayload): {
  blocks: SlackBlock[];
} {
  const { comparisons, context, ownership } = payload;
  const failed = comparisons.filter((c) => c.absoluteFailed);

  const prRef = context.prNumber
    ? `PR #${context.prNumber} by @${context.prAuthor ?? 'unknown'}`
    : `Commit by @${context.prAuthor ?? 'unknown'}`;

  const headerBlock = richTextSection([
    emojiEl('red_circle'),
    textEl(' Performance Regression Detected — ', { bold: true }),
    textEl(prRef),
  ]);

  const metricElements: Record<string, unknown>[] = [];
  for (const c of failed) {
    for (const v of c.absoluteViolations.filter(
      (violation) => violation.severity === THRESHOLD_SEVERITY.Fail,
    )) {
      const delta =
        v.threshold > 0
          ? `+${(((v.value - v.threshold) / v.threshold) * 100).toFixed(1)}%`
          : 'N/A';
      const team = resolveTeamMention(
        c.benchmarkName,
        ownership,
        context.prAuthor,
      );

      if (metricElements.length > 0) {
        metricElements.push(textEl('\n'));
      }
      metricElements.push(
        emojiEl('chart_with_upwards_trend'),
        textEl(` ${c.benchmarkName}`, { bold: true }),
        textEl(` (${v.percentile})\n`),
        textEl(
          `  Current: ${v.value.toFixed(0)}ms | Threshold: ${v.threshold.toFixed(0)}ms | Delta: ${delta}\n`,
        ),
        textEl(`  Owner: ${team}\n`),
      );
    }
  }

  const metricsBlock = richTextSection(metricElements);

  const linkElements: Record<string, unknown>[] = [
    emojiEl('information_source'),
    textEl(' ', { bold: true }),
  ];
  if (context.ciRunUrl) {
    linkElements.push(linkEl(context.ciRunUrl, 'View CI Run'));
  }
  if (context.ciRunUrl && context.prUrl) {
    linkElements.push(textEl(' | '));
  }
  if (context.prUrl) {
    linkElements.push(linkEl(context.prUrl, 'View PR'));
  }

  return {
    blocks: [
      headerBlock,
      divider(),
      metricsBlock,
      divider(),
      richTextSection(linkElements),
    ],
  };
}

// ---------------------------------------------------------------------------
// Phase 3 — Weekly digest
// ---------------------------------------------------------------------------

/**
 * Per-benchmark 7d vs 30d trend entry for the weekly digest.
 * medianDelta and p95Delta are fractional (0.21 = +21%, -0.10 = -10%).
 * medianValue7d is the absolute 7d mean in seconds (shown on non-stable rows).
 */
export type BenchmarkTrendEntry = {
  name: string;
  medianDelta: number;
  p95Delta?: number;
  /** Absolute 7d mean value in seconds — shown on Needs attention / Watch / Improving rows. */
  medianValue7d?: number;
  team?: string;
};

export type WeeklyDigestData = {
  falsePositiveRate: number;
  falsePositiveTarget: number;
  metricsPromoted: { name: string; fromTier: string; toTier: string }[];
  totalEnforced: number;
  totalMetrics: number;
  regressionsThisWeek: { total: number; real: number; flake: number };
  skipLabelUses: { prNumber: string; reason: string }[];
  graduationReadiness: {
    name: string;
    cv: number;
    fp: number;
    ready: boolean;
    note?: string;
  }[];
  /** Per-benchmark 7d vs 30d trends. Omit if trend data is unavailable. */
  benchmarkTrends?: BenchmarkTrendEntry[];
  /** Benchmarks with missing data in one or both windows. */
  dataGaps?: { name: string; note: string; team?: string }[];
};

// Thresholds for bucketing benchmark trends into sections (match SKILL.md: 5/3/-3)
const ATTENTION_MEDIAN = 0.05; // > +5%
const WATCH_MEDIAN = 0.03; // ≥ +3%
const IMPROVING_MEDIAN = -0.03; // ≤ −3%
const ATTENTION_P95 = 0.15; // p95 ≥ +15% also triggers Needs attention

const STABLE_MAX_DISPLAY = 6; // show at most N stable items before summarising

function formatDeltaPct(delta: number): string {
  const pct = (delta * 100).toFixed(0);
  return delta >= 0 ? `+${pct}%` : `${pct}%`;
}

function trendEntryElements(
  entry: BenchmarkTrendEntry,
  options: {
    showDelta?: boolean;
    showAbsolute?: boolean;
    showP95?: boolean;
  } = {},
): Record<string, unknown>[] {
  const { showDelta = true, showAbsolute = true, showP95 = true } = options;
  const elements: Record<string, unknown>[] = [
    textEl('• '),
    textEl(entry.name, { bold: true }),
  ];
  if (showDelta) {
    elements.push(
      textEl(' — '),
      textEl(formatDeltaPct(entry.medianDelta), { code: true }),
    );
  }
  if (showAbsolute && entry.medianValue7d !== undefined) {
    elements.push(
      textEl(' · 7d mean '),
      textEl(`${entry.medianValue7d.toFixed(2).replace(/\.?0+$/u, '')}s`, {
        code: true,
      }),
    );
  }
  if (showP95 && entry.p95Delta !== undefined) {
    elements.push(
      textEl(' · p95 '),
      textEl(formatDeltaPct(entry.p95Delta), { code: true }),
    );
  }
  if (entry.team) {
    elements.push(textEl(` ${entry.team}`));
  }
  elements.push(textEl('\n'));
  return elements;
}

function buildTrendSection(
  emoji: string,
  label: string,
  entries: BenchmarkTrendEntry[],
): Record<string, unknown> {
  const elements: Record<string, unknown>[] = [
    emojiEl(emoji),
    textEl(` ${label}\n`, { bold: true }),
  ];
  for (const e of entries) {
    elements.push(...trendEntryElements(e));
  }
  return richTextSection(elements);
}

/**
 * Builds the weekly digest Block Kit payload.
 * When benchmarkTrends is provided, leads with a Mobile-style trend breakdown
 * (Needs Attention / Watch / Improving / Stable) before the quality-gate summary.
 *
 * @param data - Weekly digest data (FP rate, promotions, regressions, graduation, trends).
 */
export function formatWeeklyDigest(data: WeeklyDigestData): {
  blocks: SlackBlock[];
} {
  const blocks: SlackBlock[] = [
    richTextSection([
      emojiEl('bar_chart'),
      textEl(' Extension Performance Quality Gate — Weekly', { bold: true }),
      textEl(' · 7d vs 30d', { italic: true }),
    ]),
  ];

  // --- Benchmark trend sections (Mobile-style) ---
  if (data.benchmarkTrends && data.benchmarkTrends.length > 0) {
    const attention: BenchmarkTrendEntry[] = [];
    const watch: BenchmarkTrendEntry[] = [];
    const improving: BenchmarkTrendEntry[] = [];
    const stable: BenchmarkTrendEntry[] = [];

    for (const t of data.benchmarkTrends) {
      const p95Severe = t.p95Delta !== undefined && t.p95Delta >= ATTENTION_P95;
      if (t.medianDelta > ATTENTION_MEDIAN || p95Severe) {
        attention.push(t);
      } else if (t.medianDelta >= WATCH_MEDIAN) {
        watch.push(t);
      } else if (t.medianDelta <= IMPROVING_MEDIAN) {
        improving.push(t);
      } else {
        stable.push(t);
      }
    }

    attention.sort((a, b) => b.medianDelta - a.medianDelta);
    watch.sort((a, b) => b.medianDelta - a.medianDelta);
    improving.sort((a, b) => a.medianDelta - b.medianDelta);

    if (attention.length > 0) {
      blocks.push(
        divider(),
        buildTrendSection('rotating_light', 'Needs attention', attention),
      );
    }
    if (watch.length > 0) {
      blocks.push(divider(), buildTrendSection('eyes', 'Watch', watch));
    }
    if (improving.length > 0) {
      blocks.push(divider(), buildTrendSection('tada', 'Improving', improving));
    }
    if (stable.length > 0) {
      const shown = stable.slice(0, STABLE_MAX_DISPLAY);
      const hidden = stable.length - shown.length;
      const stableElements: Record<string, unknown>[] = [
        emojiEl('white_check_mark'),
        textEl(' Stable\n', { bold: true }),
      ];
      for (const e of shown) {
        // Stable rows: name only (no absolute value, no p95)
        stableElements.push(
          ...trendEntryElements(e, {
            showAbsolute: false,
            showP95: false,
          }),
        );
      }
      if (hidden > 0) {
        stableElements.push(
          textEl(`  …and ${hidden} more within normal range\n`, {
            italic: true,
          }),
        );
      }
      blocks.push(divider(), richTextSection(stableElements));
    }

    if (data.dataGaps && data.dataGaps.length > 0) {
      const gapElements: Record<string, unknown>[] = [
        emojiEl('grey_question'),
        textEl(' Data gaps\n', { bold: true }),
      ];
      for (const g of data.dataGaps) {
        gapElements.push(textEl('• '), textEl(g.name, { bold: true }));
        if (g.note) {
          gapElements.push(textEl(` — ${g.note}`));
        }
        if (g.team) {
          gapElements.push(textEl(` ${g.team}`));
        }
        gapElements.push(textEl('\n'));
      }
      blocks.push(divider(), richTextSection(gapElements));
    }
  }

  // --- Quality gate summary ---
  const promotedText =
    data.metricsPromoted.length > 0
      ? data.metricsPromoted.map((m) => m.name).join(', ')
      : 'none';

  const summaryElements: Record<string, unknown>[] = [
    textEl(
      `${(data.falsePositiveRate * 100).toFixed(1)}% false-positive rate (target: <${(data.falsePositiveTarget * 100).toFixed(0)}%)\n`,
    ),
    textEl(
      `Regressions: ${data.regressionsThisWeek.total} total · ${data.regressionsThisWeek.real} real · ${data.regressionsThisWeek.flake} flake\n`,
    ),
    textEl(
      `Enforced: ${data.totalEnforced}/${data.totalMetrics} metrics · ${data.metricsPromoted.length} promoted`,
    ),
  ];
  if (data.metricsPromoted.length > 0) {
    summaryElements.push(textEl(` (${promotedText})`));
  }
  summaryElements.push(textEl('\n'));

  if (data.skipLabelUses.length > 0) {
    summaryElements.push(textEl('Skip label uses: ', { bold: true }));
    for (const s of data.skipLabelUses) {
      summaryElements.push(textEl(`#${s.prNumber} — ${s.reason}\n`));
    }
  }

  blocks.push(divider(), richTextSection(summaryElements));

  // Graduation readiness section
  const readyMetrics = data.graduationReadiness.filter((m) => m.ready);
  const notReadyMetrics = data.graduationReadiness.filter((m) => !m.ready);

  if (readyMetrics.length > 0 || notReadyMetrics.length > 0) {
    const gradElements: Record<string, unknown>[] = [
      emojiEl('graduation_cap'),
      textEl(' Graduation Readiness\n', { bold: true }),
    ];
    for (const m of readyMetrics) {
      gradElements.push(
        emojiEl('white_check_mark'),
        textEl(` ${m.name} (CV ${m.cv.toFixed(0)}%, FP ${m.fp.toFixed(1)}%)\n`),
      );
    }
    for (const m of notReadyMetrics) {
      gradElements.push(
        emojiEl('x'),
        textEl(
          ` ${m.name} (CV ${m.cv.toFixed(0)}%${m.note ? ` — ${m.note}` : ''})\n`,
        ),
      );
    }
    blocks.push(divider(), richTextSection(gradElements));
  }

  return { blocks };
}

// ---------------------------------------------------------------------------
// Phase 4 — Skip-label and baseline-reset alerts
// ---------------------------------------------------------------------------

export type SkipAlertData = {
  prNumber: string;
  prUrl: string;
  prAuthor: string;
  justification: string;
};

/**
 * Builds the skip-label alert Block Kit payload.
 *
 * @param data - Skip alert data (PR number, URL, author, justification).
 */
export function formatSkipAlert(data: SkipAlertData): { blocks: SlackBlock[] } {
  return {
    blocks: [
      richTextSection([
        emojiEl('warning'),
        textEl(' Benchmark Gate Skipped\n', { bold: true }),
        linkEl(data.prUrl, `PR #${data.prNumber}`),
        textEl(` by @${data.prAuthor}\n`),
        textEl('Justification: ', { bold: true }),
        textEl(data.justification || 'none provided'),
      ]),
    ],
  };
}

export type BaselineResetData = {
  benchmarkName: string;
  commit: string;
  author: string;
  prUrl?: string;
};

/**
 * Builds the baseline-reset alert Block Kit payload.
 *
 * @param data - Baseline reset data (benchmark name, commit, author, PR URL).
 */
export function formatBaselineReset(data: BaselineResetData): {
  blocks: SlackBlock[];
} {
  const elements: Record<string, unknown>[] = [
    emojiEl('arrows_counterclockwise'),
    textEl(' Baseline Reset\n', { bold: true }),
    textEl('Benchmark: ', { bold: true }),
    textEl(`${data.benchmarkName}\n`),
    textEl('Commit: ', { bold: true }),
    textEl(`${data.commit.slice(0, 7)} by @${data.author}\n`),
  ];

  if (data.prUrl) {
    elements.push(linkEl(data.prUrl, 'View PR'));
  }

  return { blocks: [richTextSection(elements)] };
}

// ---------------------------------------------------------------------------
// Batching
// ---------------------------------------------------------------------------

async function loadBatch(): Promise<BatchEntry[]> {
  try {
    const batchFile = await getBatchFilePath();
    const raw = await fs.readFile(batchFile, 'utf-8');
    return JSON.parse(raw) as BatchEntry[];
  } catch {
    return [];
  }
}

async function saveBatch(entries: BatchEntry[]): Promise<void> {
  const batchFile = await getBatchFilePath();
  await fs.writeFile(batchFile, JSON.stringify(entries, null, 2), {
    mode: 0o600,
  });
}

async function clearBatch(): Promise<void> {
  try {
    const batchFile = await getBatchFilePath();
    await fs.unlink(batchFile);
  } catch {
    // file doesn't exist — fine
  }
}

/**
 * Formats a batched notification combining multiple regressions
 * accumulated within the batching window.
 *
 * @param entries - Accumulated batch entries to format.
 * @param context - Slack context (webhook URL, PR info).
 * @param ownership - Benchmark ownership map.
 */
export function formatBatchedNotification(
  entries: BatchEntry[],
  context: SlackContext,
  ownership: OwnershipMap,
): { blocks: SlackBlock[] } {
  const headerBlock = richTextSection([
    emojiEl('red_circle'),
    textEl(
      ` ${entries.length} Performance Regression${entries.length > 1 ? 's' : ''} Detected`,
      { bold: true },
    ),
  ]);

  const metricElements: Record<string, unknown>[] = [];
  for (const e of entries) {
    const v = e.violation;
    const delta =
      v.threshold > 0
        ? `+${(((v.value - v.threshold) / v.threshold) * 100).toFixed(1)}%`
        : 'N/A';
    const team = resolveTeamMention(
      e.comparison.benchmarkName,
      ownership,
      context.prAuthor,
    );

    metricElements.push(
      emojiEl('chart_with_upwards_trend'),
      textEl(` ${e.comparison.benchmarkName}`, { bold: true }),
      textEl(
        ` (${v.percentile}): ${v.value.toFixed(0)}ms / ${v.threshold.toFixed(0)}ms (${delta}) — ${team}\n`,
      ),
    );
  }

  const linkElements: Record<string, unknown>[] = [
    emojiEl('information_source'),
    textEl(' '),
  ];
  if (context.ciRunUrl) {
    linkElements.push(linkEl(context.ciRunUrl, 'View CI Run'));
  }
  if (context.ciRunUrl && context.prUrl) {
    linkElements.push(textEl(' | '));
  }
  if (context.prUrl) {
    linkElements.push(linkEl(context.prUrl, 'View PR'));
  }

  return {
    blocks: [
      headerBlock,
      divider(),
      richTextSection(metricElements),
      divider(),
      richTextSection(linkElements),
    ],
  };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

/**
 * Posts a Block Kit payload to the Slack incoming webhook.
 * Uses @slack/webhook IncomingWebhook for consistency with MetaMask Bot.
 *
 * @param webhookUrl - Slack incoming webhook URL.
 * @param payload - The Block Kit payload to send.
 * @param payload.blocks - Block Kit blocks array.
 */
export async function postToSlack(
  webhookUrl: string,
  payload: { blocks: SlackBlock[] },
): Promise<void> {
  const webhook = new IncomingWebhook(webhookUrl);
  try {
    // @ts-expect-error SlackBlock is structurally compatible but narrower than @slack/types Block
    await webhook.send({ blocks: payload.blocks });
  } catch (err) {
    console.error('Slack webhook failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Public API — called by compare-benchmarks.ts
// ---------------------------------------------------------------------------

/**
 * Sends Slack notifications for benchmark comparison results.
 *
 * Behaviour:
 * - No failures -> no notification
 * - Severe regression -> immediate notification (bypasses batching)
 * - Normal failure -> batched (accumulated in /tmp, flushed after 1h window)
 *
 * @param comparisons - Benchmark comparison results.
 * @param context - Slack context (webhook URL, PR info).
 * @param thresholdConfigs - Optional per-benchmark threshold configs for severity.
 */
export async function sendBenchmarkNotifications(
  comparisons: BenchmarkEntryComparison[],
  context: SlackContext,
  thresholdConfigs?: Record<string, ThresholdConfig>,
): Promise<void> {
  if (!context.webhookUrl) {
    return;
  }

  const failed = comparisons.filter((c) => c.absoluteFailed);
  if (failed.length === 0) {
    return;
  }

  const ownership = await loadOwnershipMap();

  // Collect all fail-severity violations
  const violations: {
    comparison: BenchmarkEntryComparison;
    violation: ThresholdViolation;
  }[] = [];
  for (const c of failed) {
    for (const v of c.absoluteViolations.filter(
      (violation) => violation.severity === THRESHOLD_SEVERITY.Fail,
    )) {
      violations.push({ comparison: c, violation: v });
    }
  }

  // Partition into severe (immediate) vs normal (batched)
  const severe: typeof violations = [];
  const normal: typeof violations = [];
  for (const entry of violations) {
    const config = thresholdConfigs?.[entry.comparison.benchmarkName];
    if (isSevereRegression(entry.violation, config)) {
      severe.push(entry);
    } else {
      normal.push(entry);
    }
  }

  // Severe regressions: send immediately
  if (severe.length > 0) {
    const payload = formatFailVerdict({
      comparisons: severe.map((s) => s.comparison),
      context,
      ownership,
    });
    await postToSlack(context.webhookUrl, payload);
  }

  // Normal regressions: batch
  if (normal.length > 0) {
    const now = Date.now();
    const batch = await loadBatch();

    // Filter out stale entries (older than batch window)
    const fresh = batch.filter((e) => now - e.timestamp < BATCH_WINDOW_MS);

    // Add new entries
    for (const entry of normal) {
      fresh.push({
        comparison: entry.comparison,
        violation: entry.violation,
        timestamp: now,
      });
    }

    // Check if the oldest entry in the pre-filter batch has exceeded the window.
    // Must use `batch` not `fresh` — fresh entries are by definition < BATCH_WINDOW_MS old.
    const oldest = batch.reduce(
      (min, e) => Math.min(min, e.timestamp),
      Infinity,
    );
    if (now - oldest >= BATCH_WINDOW_MS || severe.length > 0) {
      // Flush batch
      const payload = formatBatchedNotification(fresh, context, ownership);
      await postToSlack(context.webhookUrl, payload);
      await clearBatch();
    } else {
      await saveBatch(fresh);
    }
  }
}

/**
 * Forces a flush of any pending batched notifications.
 * Called by a scheduled job or at the end of the CI pipeline.
 *
 * @param context - Slack context (webhook URL, PR info).
 */
export async function flushBatchedNotifications(
  context: SlackContext,
): Promise<void> {
  if (!context.webhookUrl) {
    return;
  }

  const batch = await loadBatch();
  if (batch.length === 0) {
    return;
  }

  const ownership = await loadOwnershipMap();
  const payload = formatBatchedNotification(batch, context, ownership);
  await postToSlack(context.webhookUrl, payload);
  await clearBatch();
}
