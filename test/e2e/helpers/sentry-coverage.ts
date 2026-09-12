/**
 * Sentry coverage harness — parse / normalize / diff the envelopes the
 * extension sends to Sentry, so a migration (e.g. SDK v8 → v10) can be checked
 * for *behavioral* equivalence rather than trusted on a green suite.
 *
 * Usage (see `test/e2e/tests/metrics/sentry-coverage.spec.ts`): capture every
 * raw POST body to the mocked Sentry DSN during a fixed flow, then
 * `parseSentryEnvelopes` → `summarizeCoverage` → `diffCoverage(baseline,
 * current)` to surface structural deltas (added/removed items, per-type counts,
 * changed tag coverage) with volatile ids/timestamps normalized away.
 *
 * Tracked by #43819. Pure functions, no Sentry/runtime imports — unit-tested in
 * `sentry-coverage.test.ts`.
 */

/** A single item unpacked from a Sentry envelope (event, transaction, …). */
export type EnvelopeItem = {
  /** The item header's `type` (`event`, `transaction`, `session`, `client_report`, …). */
  type: string;
  /** The item payload (the line after the item header). */
  payload: Record<string, unknown>;
};

/** Keys whose values vary run-to-run and must be dropped before comparing. */
export const VOLATILE_KEYS: ReadonlySet<string> = new Set([
  'event_id',
  'timestamp',
  'start_timestamp',
  'sent_at',
  'trace_id',
  'span_id',
  'parent_span_id',
  'replay_id',
  'sid', // session id
  'started',
  'duration',
  'sdkProcessingMetadata',
  'received',
  'profile_id',
  'segment_id',
]);

/**
 * Parse one raw Sentry envelope body. Envelopes are newline-delimited JSON: an
 * envelope header line, then repeating [item-header, payload] line pairs
 * (https://develop.sentry.dev/sdk/envelopes/).
 *
 * @param rawBody - The raw POST body sent to the Sentry `/envelope` endpoint.
 * @returns The envelope's items. Malformed lines are skipped, not thrown on,
 * so one bad envelope can't sink a whole capture run.
 */
export function parseSentryEnvelope(rawBody: string): EnvelopeItem[] {
  const lines = rawBody.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  const items: EnvelopeItem[] = [];
  // Line 0 is the envelope header; items start at line 1 as header/payload pairs.
  for (let i = 1; i < lines.length; i += 2) {
    const header = safeJsonParse(lines[i]);
    const payload = safeJsonParse(lines[i + 1]);
    // Require both a typed item header and a parseable payload — an item we
    // can't read can't be normalized or diffed, so skip it rather than emit noise.
    if (!header || typeof header.type !== 'string' || !payload) {
      continue;
    }
    items.push({
      type: header.type,
      payload,
    });
  }
  return items;
}

/**
 * Parse many raw envelope bodies into one flat item list.
 *
 * @param rawBodies - All raw POST bodies captured during a flow.
 * @returns Every envelope item across all bodies.
 */
export function parseSentryEnvelopes(rawBodies: string[]): EnvelopeItem[] {
  return rawBodies.flatMap(parseSentryEnvelope);
}

/**
 * Recursively drop volatile keys from a value so two runs compare equal modulo
 * run-specific ids/timestamps.
 *
 * @param value - Any JSON value.
 * @param volatileKeys - Keys to strip (defaults to {@link VOLATILE_KEYS}).
 * @returns A deep copy with volatile keys removed.
 */
export function stripVolatile(
  value: unknown,
  volatileKeys: ReadonlySet<string> = VOLATILE_KEYS,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stripVolatile(entry, volatileKeys));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (volatileKeys.has(key)) {
        continue;
      }
      out[key] = stripVolatile(val, volatileKeys);
    }
    return out;
  }
  return value;
}

/**
 * A stable identity for an envelope item, used to pair items across runs even
 * though their order and ids differ. Errors key on exception type+value (their
 * Sentry grouping inputs); transactions on their name; everything else on type.
 *
 * @param item - The envelope item.
 * @returns A stable signature string.
 */
export function itemSignature(item: EnvelopeItem): string {
  const { type, payload } = item;
  if (type === 'transaction') {
    return `transaction:${String(payload.transaction ?? '<unnamed>')}`;
  }
  if (type === 'event') {
    const exception = (
      payload.exception as { values?: { type?: string; value?: string }[] }
    )?.values?.[0];
    if (exception) {
      return `event:${exception.type ?? ''}:${exception.value ?? ''}`;
    }
    return `event:message:${String(payload.message ?? '')}`;
  }
  return `${type}`;
}

/**
 * Tag keys present on an item's payload (errors/transactions carry `tags`).
 * @param payload
 */
function tagKeysOf(payload: Record<string, unknown>): string[] {
  const { tags } = payload;
  return tags && typeof tags === 'object'
    ? Object.keys(tags as Record<string, unknown>).sort()
    : [];
}

/** A normalized, diff-friendly view of one envelope item. */
export type NormalizedItem = {
  signature: string;
  type: string;
  /** Sorted tag keys (coverage of correlation tags like `otelTraceId`). */
  tagKeys: string[];
  /** The volatile-stripped payload (structural comparison). */
  payload: unknown;
};

/** A stable snapshot of an entire capture, ready to baseline or diff. */
export type CoverageSummary = {
  /** Count of envelope items by `type` (the volume / quota axis). */
  countsByType: Record<string, number>;
  /** Normalized items keyed by signature (multiple per signature allowed). */
  items: NormalizedItem[];
};

/**
 * Reduce captured items to a stable snapshot: per-type counts plus each item
 * normalized (volatile-stripped, tag keys extracted), sorted by signature.
 *
 * @param items - Parsed envelope items.
 * @returns A deterministic {@link CoverageSummary}.
 */
export function summarizeCoverage(items: EnvelopeItem[]): CoverageSummary {
  const countsByType: Record<string, number> = {};
  const normalized: NormalizedItem[] = [];

  for (const item of items) {
    countsByType[item.type] = (countsByType[item.type] ?? 0) + 1;
    normalized.push({
      signature: itemSignature(item),
      type: item.type,
      tagKeys: tagKeysOf(item.payload),
      payload: stripVolatile(item.payload),
    });
  }

  normalized.sort((a, b) => a.signature.localeCompare(b.signature));
  return { countsByType, items: normalized };
}

/** The result of comparing a baseline capture to a current one. */
export type CoverageDiff = {
  /** True when the two captures are equivalent (no structural delta). */
  equivalent: boolean;
  /** Item signatures present in current but not baseline. */
  addedSignatures: string[];
  /** Item signatures present in baseline but not current. */
  removedSignatures: string[];
  /** Per-signature tag-key deltas (added/removed correlation tags). */
  tagChanges: { signature: string; added: string[]; removed: string[] }[];
  /** Per-type envelope-count deltas (the volume / quota axis). */
  countDeltas: { type: string; baseline: number; current: number }[];
};

/**
 * Diff two coverage summaries. Surfaces what a reviewer of an SDK migration
 * actually cares about: missing/extra envelope items, changed tag coverage, and
 * volume changes — with volatile ids/timestamps already normalized away.
 *
 * @param baseline - The reference capture (e.g. v8).
 * @param current - The capture to verify (e.g. v10).
 * @returns A {@link CoverageDiff}; `equivalent` is true when all deltas are empty.
 */
export function diffCoverage(
  baseline: CoverageSummary,
  current: CoverageSummary,
): CoverageDiff {
  const baseBySig = groupBySignature(baseline.items);
  const currBySig = groupBySignature(current.items);

  const allSignatures = new Set([...baseBySig.keys(), ...currBySig.keys()]);
  const addedSignatures: string[] = [];
  const removedSignatures: string[] = [];
  const tagChanges: CoverageDiff['tagChanges'] = [];

  for (const signature of [...allSignatures].sort()) {
    const inBase = baseBySig.has(signature);
    const inCurr = currBySig.has(signature);
    if (inCurr && !inBase) {
      addedSignatures.push(signature);
      continue;
    }
    if (inBase && !inCurr) {
      removedSignatures.push(signature);
      continue;
    }
    const baseTags = new Set(baseBySig.get(signature)?.[0]?.tagKeys ?? []);
    const currTags = new Set(currBySig.get(signature)?.[0]?.tagKeys ?? []);
    const added = [...currTags].filter((tag) => !baseTags.has(tag)).sort();
    const removed = [...baseTags].filter((tag) => !currTags.has(tag)).sort();
    if (added.length > 0 || removed.length > 0) {
      tagChanges.push({ signature, added, removed });
    }
  }

  const countDeltas: CoverageDiff['countDeltas'] = [];
  const allTypes = new Set([
    ...Object.keys(baseline.countsByType),
    ...Object.keys(current.countsByType),
  ]);
  for (const type of [...allTypes].sort()) {
    const base = baseline.countsByType[type] ?? 0;
    const curr = current.countsByType[type] ?? 0;
    if (base !== curr) {
      countDeltas.push({ type, baseline: base, current: curr });
    }
  }

  return {
    equivalent:
      addedSignatures.length === 0 &&
      removedSignatures.length === 0 &&
      tagChanges.length === 0 &&
      countDeltas.length === 0,
    addedSignatures,
    removedSignatures,
    tagChanges,
    countDeltas,
  };
}

function groupBySignature(
  items: NormalizedItem[],
): Map<string, NormalizedItem[]> {
  const map = new Map<string, NormalizedItem[]>();
  for (const item of items) {
    const bucket = map.get(item.signature);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(item.signature, [item]);
    }
  }
  return map;
}

function safeJsonParse(
  line: string | undefined,
): Record<string, unknown> | null {
  if (!line) {
    return null;
  }
  try {
    const parsed = JSON.parse(line);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
