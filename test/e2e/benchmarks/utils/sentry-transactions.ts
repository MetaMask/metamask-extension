import type { MockedEndpoint } from 'mockttp';
import type { TraceName } from '../../../../shared/lib/trace';
import type { Driver } from '../../webdriver/driver';
import type { TimerResult } from './types';

const SENTRY_ENVELOPE_URL = /sentry\.io\/api\/\d+\/envelope/u;

/**
 * One transaction as the Sentry SDK sent it.
 */
export type SentryTransaction = {
  name: string;
  durationMs: number;
  endTimestamp: number;
  success: boolean;
};

type TransactionPayload = {
  transaction?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  start_timestamp?: number;
  timestamp?: number;
  contexts?: {
    trace?: { status?: string; data?: { success?: unknown } };
  };
};

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
          transactions.push({
            name: transaction,
            // Envelope timestamps are in seconds.
            durationMs: (timestamp - startTimestamp) * 1000,
            endTimestamp: timestamp,
            success:
              trace?.data?.success !== false &&
              (trace?.status === undefined || trace.status === 'ok'),
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
 * Wait until each named trace has sent a transaction or `timeoutMs` passes.
 * Returns the last read either way.
 */
export async function waitForSentryTransactions(
  driver: Driver,
  endpoints: MockedEndpoint[],
  names: TraceName[],
  timeoutMs = 10000,
): Promise<SentryTransaction[]> {
  const pollMs = 250;
  let transactions = await readSentryTransactions(endpoints);
  for (let waited = 0; waited < timeoutMs; waited += pollMs) {
    const sent = new Set(transactions.map((transaction) => transaction.name));
    if (names.every((name) => sent.has(name))) {
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

  // Tagged with a unit so the runner leaves it out of the per-run `total`,
  // which sums only untagged timers: the spans overlap the step timers, and
  // adding both would count the same time twice.
  return { id, value: last.durationMs, unit: 'ms' };
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
