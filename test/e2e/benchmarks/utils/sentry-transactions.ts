import type { MockedEndpoint } from 'mockttp';
import type { TraceName } from '../../../../shared/lib/trace';
import type { Driver } from '../../webdriver/driver';
import type { TimerResult } from './types';

const SENTRY_ENVELOPE_URL = /sentry\.io\/api\/\d+\/envelope/u;

/**
 * One child span of a transaction, as the Sentry SDK sent it in the
 * transaction's `spans` array.
 */
export type SentrySpan = {
  spanId?: string;
  /** The span this one is a child of: the transaction or another child. */
  parentSpanId?: string;
  op?: string;
  description?: string;
  /** Seconds, on the same clock as the transaction's own timestamps. */
  startTimestamp: number;
  /** Seconds, on the same clock as the transaction's own timestamps. */
  endTimestamp: number;
  durationMs: number;
};

/**
 * One transaction as the Sentry SDK sent it.
 */
export type SentryTransaction = {
  name: string;
  durationMs: number;
  endTimestamp: number;
  success: boolean;
  /**
   * The outcome the trace recorded in `endTrace`'s `data.result`, if any.
   * `success` misses it: a trace ended as `cancelled` still reads as ok.
   */
  result?: string;
  /**
   * The `isRefresh` attribute the trace set at start, if any. The SDK forwards
   * start `data` to `contexts.trace.data`, where `result` also arrives.
   */
  isRefresh?: boolean;
  /** The transaction's own span id, from `contexts.trace.span_id`. */
  spanId?: string;
  /**
   * The child spans the SDK sent with the transaction, where it sent any:
   * the work it recorded inside the transaction's interval.
   */
  spans?: SentrySpan[];
};

/* eslint-disable @typescript-eslint/naming-convention */
type SpanPayload = {
  span_id?: unknown;
  parent_span_id?: unknown;
  op?: unknown;
  description?: unknown;
  start_timestamp?: unknown;
  timestamp?: unknown;
};

type TransactionPayload = {
  transaction?: string;
  start_timestamp?: number;
  timestamp?: number;
  spans?: unknown;
  contexts?: {
    trace?: {
      status?: string;
      span_id?: unknown;
      data?: { success?: unknown; result?: unknown; isRefresh?: unknown };
    };
  };
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Parse a transaction's `spans` array in the order sent, skipping any span
 * without numeric start and end timestamps.
 */
function parseChildSpans(raw: unknown): SentrySpan[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const spans: SentrySpan[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const span = item as SpanPayload;
    const startTimestamp = span.start_timestamp;
    const endTimestamp = span.timestamp;
    if (
      typeof startTimestamp !== 'number' ||
      typeof endTimestamp !== 'number'
    ) {
      continue;
    }
    spans.push({
      ...(typeof span.span_id === 'string' && { spanId: span.span_id }),
      ...(typeof span.parent_span_id === 'string' && {
        parentSpanId: span.parent_span_id,
      }),
      ...(typeof span.op === 'string' && { op: span.op }),
      ...(typeof span.description === 'string' && {
        description: span.description,
      }),
      startTimestamp,
      endTimestamp,
      durationMs: (endTimestamp - startTimestamp) * 1000,
    });
  }
  return spans;
}

/**
 * Parse the transactions out of one Sentry envelope, in item order. The body
 * is newline-delimited JSON: an envelope header, then a header and a payload
 * per item.
 */
export function parseEnvelopeTransactions(body: string): SentryTransaction[] {
  const lines = body.split('\n');
  const transactions: SentryTransaction[] = [];
  let index = 1;
  while (index + 1 < lines.length) {
    let itemType: unknown;
    try {
      itemType = JSON.parse(lines[index]).type;
    } catch {
      index += 1;
      continue;
    }
    if (itemType === 'transaction') {
      try {
        const payload = JSON.parse(lines[index + 1]) as TransactionPayload;
        const { transaction, timestamp } = payload;
        const startTimestamp = payload.start_timestamp;
        if (
          typeof transaction === 'string' &&
          typeof timestamp === 'number' &&
          typeof startTimestamp === 'number'
        ) {
          const trace = payload.contexts?.trace;
          const spans = parseChildSpans(payload.spans);
          transactions.push({
            name: transaction,
            // Envelope timestamps are in seconds.
            durationMs: (timestamp - startTimestamp) * 1000,
            endTimestamp: timestamp,
            success:
              trace?.data?.success !== false &&
              (trace?.status === undefined || trace.status === 'ok'),
            ...(typeof trace?.data?.result === 'string' && {
              result: trace.data.result,
            }),
            ...(typeof trace?.data?.isRefresh === 'boolean' && {
              isRefresh: trace.data.isRefresh,
            }),
            ...(typeof trace?.span_id === 'string' && {
              spanId: trace.span_id,
            }),
            ...(spans.length > 0 && { spans }),
          });
        }
      } catch {
        // A payload that is not JSON is not a transaction we can read.
      }
    }
    index += 2;
  }
  return transactions;
}

/**
 * Read every transaction the SDK has sent to the mocked Sentry endpoint so
 * far, ordered by when each ended.
 */
export async function readSentryTransactions(
  endpoints: MockedEndpoint[],
): Promise<SentryTransaction[]> {
  const transactions: SentryTransaction[] = [];
  for (const endpoint of endpoints) {
    for (const request of await endpoint.getSeenRequests()) {
      if (SENTRY_ENVELOPE_URL.test(request.url)) {
        transactions.push(
          ...parseEnvelopeTransactions((await request.body.getText()) ?? ''),
        );
      }
    }
  }
  return transactions.sort((a, b) => a.endTimestamp - b.endTimestamp);
}

/**
 * Wait until each named trace has sent `expected[name]` transactions (1 when
 * unlisted) or `timeoutMs` passes. Returns the last read either way.
 */
export async function waitForSentryTransactions(
  driver: Driver,
  endpoints: MockedEndpoint[],
  names: TraceName[],
  {
    timeoutMs = 10000,
    expected = {},
  }: {
    timeoutMs?: number;
    expected?: Partial<Record<TraceName, number>>;
  } = {},
): Promise<SentryTransaction[]> {
  const pollMs = 250;
  // Count instances, not names. Breaking on name-presence returns as soon as
  // one transaction of each name has arrived, so a caller expecting a second
  // occurrence of the same trace reads whatever happened to have flushed --
  // which makes a count-based known-answer check a race rather than a check.
  const enough = (read: SentryTransaction[]) =>
    names.every(
      (name) =>
        read.filter((transaction) => transaction.name === name).length >=
        (expected[name] ?? 1),
    );
  let transactions = await readSentryTransactions(endpoints);
  for (let waited = 0; waited < timeoutMs; waited += pollMs) {
    if (enough(transactions)) {
      break;
    }
    await driver.delay(pollMs);
    transactions = await readSentryTransactions(endpoints);
  }
  return transactions;
}

/**
 * Turn a trace's last transaction from {@link readSentryTransactions} into a
 * timer under `id`. Throws when it is absent or failed, so the iteration fails
 * rather than the sample silently losing a value.
 */
export function sentryTimerResult(
  transactions: SentryTransaction[],
  name: TraceName,
  id: string,
): TimerResult {
  const matching = transactions.filter(
    (transaction) => transaction.name === name,
  );
  const last = matching[matching.length - 1];

  if (!last) {
    throw new Error(
      `Trace "${name}" was not sent to Sentry, so "${id}" has no value`,
    );
  }
  if (!last.success) {
    throw new Error(
      `Trace "${name}" last completed unsuccessfully, so "${id}" is not a timing`,
    );
  }
  // A trace that records its own outcome must have completed, not been
  // cancelled or errored. `success` cannot see this: the outcome lives in
  // `data.result` and a cancelled span still carries an ok status.
  if (last.result !== undefined && last.result !== 'success') {
    throw new Error(
      `Trace "${name}" last completed as "${last.result}", so "${id}" is not a timing`,
    );
  }

  // Tagged with a unit so the runner leaves it out of the per-run `total`,
  // which sums only untagged timers: the spans overlap the step timers, and
  // adding both would count the same time twice.
  return { id, value: last.durationMs, unit: 'ms' };
}

/**
 * Like `sentryTimerResult`, but over the trace's first non-refresh completion,
 * so the value does not move with how many refreshes follow it. Falls back to
 * `sentryTimerResult` when no completion has `isRefresh: false`.
 */
export function sentryInitialTimerResult(
  transactions: SentryTransaction[],
  name: TraceName,
  id: string,
): TimerResult {
  const matching = transactions.filter(
    (transaction) => transaction.name === name,
  );
  const initial = matching.find(
    (transaction) => transaction.isRefresh === false,
  );
  if (!initial) {
    return sentryTimerResult(transactions, name, id);
  }
  if (!initial.success) {
    throw new Error(
      `Trace "${name}" initial completion was unsuccessful, so "${id}" is not a timing`,
    );
  }
  if (initial.result !== undefined && initial.result !== 'success') {
    throw new Error(
      `Trace "${name}" initial completion was "${initial.result}", so "${id}" is not a timing`,
    );
  }
  return { id, value: initial.durationMs, unit: 'ms' };
}

/**
 * Report how many times a trace was sent, under `id`. A change in this count
 * changes what the trace's last duration covers.
 */
export function sentryCountResult(
  transactions: SentryTransaction[],
  name: TraceName,
  id: string,
): TimerResult {
  return {
    id,
    value: transactions.filter((transaction) => transaction.name === name)
      .length,
    unit: 'count',
  };
}

/**
 * One child span that overlaps a target transaction, placed on that
 * transaction's timeline.
 */
export type SpanBreakdownRow = {
  /** The name of the transaction that sent the span. */
  transaction: string;
  op?: string;
  description?: string;
  /**
   * Milliseconds from the target's start to the span's start. Negative when
   * the span began before the target did.
   */
  startOffsetMs: number;
  durationMs: number;
};

/**
 * Every child span, from any transaction read, that overlaps `target`'s
 * interval, earliest first. `startTrace` does not keep its span active, so
 * automatic spans in that interval can arrive in another transaction.
 */
export function spansDuring(
  transactions: SentryTransaction[],
  target: SentryTransaction,
): SpanBreakdownRow[] {
  const end = target.endTimestamp;
  const start = end - target.durationMs / 1000;
  const rows: SpanBreakdownRow[] = [];
  for (const transaction of transactions) {
    for (const span of transaction.spans ?? []) {
      if (span.endTimestamp <= start || span.startTimestamp >= end) {
        continue;
      }
      rows.push({
        transaction: transaction.name,
        ...(span.op !== undefined && { op: span.op }),
        ...(span.description !== undefined && {
          description: span.description,
        }),
        startOffsetMs: (span.startTimestamp - start) * 1000,
        durationMs: span.durationMs,
      });
    }
  }
  return rows.sort((a, b) => a.startOffsetMs - b.startOffsetMs);
}

/**
 * Describe a trace's last transaction and the child spans inside it on one
 * line for the job log, or say the trace was not sent.
 */
export function describeSpanBreakdown(
  transactions: SentryTransaction[],
  name: TraceName,
): string {
  const matching = transactions.filter(
    (transaction) => transaction.name === name,
  );
  const target = matching[matching.length - 1];
  if (!target) {
    return `${name}: not sent (${transactions.length} transactions read)`;
  }
  const rows = spansDuring(transactions, target);
  const head = `${name} ${target.durationMs.toFixed(1)} ms: ${rows.length} child spans inside it, from ${transactions.length} transactions read`;
  if (rows.length === 0) {
    return head;
  }
  const described = rows.map(
    (row) =>
      `${row.startOffsetMs < 0 ? '' : '+'}${row.startOffsetMs.toFixed(1)} ms ${row.durationMs.toFixed(1)} ms ${
        row.op ?? '(no op)'
      } "${row.description ?? ''}" [${row.transaction}]`,
  );
  return `${head}: ${described.join('; ')}`;
}
