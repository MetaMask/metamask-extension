import { TraceName } from '../../../../shared/lib/trace';
import type { SentryTransaction } from './sentry-transactions';
import {
  parseEnvelopeTransactions,
  sentryCountResult,
  sentryTimerResult,
} from './sentry-transactions';

function transactionItem(
  name: string,
  startSeconds: number,
  endSeconds: number,
  trace: Record<string, unknown> = {},
): string[] {
  return [
    JSON.stringify({ type: 'transaction' }),
    JSON.stringify({
      transaction: name,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      start_timestamp: startSeconds,
      timestamp: endSeconds,
      contexts: { trace },
    }),
  ];
}

function envelope(...items: string[][]): string {
  return [JSON.stringify({ sdk: { name: 'sentry.javascript.browser' } })]
    .concat(...items)
    .join('\n');
}

function transaction(
  name: TraceName,
  durationMs: number,
  endTimestamp: number,
  success = true,
): SentryTransaction {
  return { name, durationMs, endTimestamp, success };
}

describe('parseEnvelopeTransactions', () => {
  it('reads each transaction item and converts seconds to milliseconds', () => {
    const body = envelope(
      transactionItem(TraceName.SwapViewLoaded, 1000, 1000.125),
      transactionItem(TraceName.SwapQuoteFetch, 1001, 1003.25),
    );

    expect(parseEnvelopeTransactions(body)).toStrictEqual([
      {
        name: TraceName.SwapViewLoaded,
        durationMs: 125,
        endTimestamp: 1000.125,
        success: true,
      },
      {
        name: TraceName.SwapQuoteFetch,
        durationMs: 2250,
        endTimestamp: 1003.25,
        success: true,
      },
    ]);
  });

  it('skips items that are not transactions', () => {
    const body = envelope(
      [JSON.stringify({ type: 'event' }), JSON.stringify({ message: 'x' })],
      transactionItem(TraceName.SwapViewLoaded, 1000, 1000.1),
    );

    expect(
      parseEnvelopeTransactions(body).map((item) => item.name),
    ).toStrictEqual([TraceName.SwapViewLoaded]);
  });

  it('marks a transaction ended with `success: false` as unsuccessful', () => {
    const body = envelope(
      transactionItem(TraceName.SwapQuoteFetch, 1000, 1001, {
        data: { success: false },
      }),
    );

    expect(parseEnvelopeTransactions(body)[0].success).toBe(false);
  });

  it('marks a transaction with an error status as unsuccessful', () => {
    const body = envelope(
      transactionItem(TraceName.SwapQuoteFetch, 1000, 1001, {
        status: 'internal_error',
      }),
    );

    expect(parseEnvelopeTransactions(body)[0].success).toBe(false);
  });
});

describe('sentryTimerResult', () => {
  it('reports the last sent transaction of the named trace', () => {
    const transactions = [
      transaction(TraceName.SwapQuoteFetch, 400, 1),
      transaction(TraceName.SwapViewLoaded, 900, 2),
      transaction(TraceName.SwapQuoteFetch, 2100, 3),
    ];

    expect(
      sentryTimerResult(
        transactions,
        TraceName.SwapQuoteFetch,
        'swapQuoteFetch',
      ),
    ).toStrictEqual({ id: 'swapQuoteFetch', value: 2100, unit: 'ms' });
  });

  it('tags the result with a unit so the per-run total leaves it out', () => {
    const result = sentryTimerResult(
      [transaction(TraceName.SwapViewLoaded, 900, 1)],
      TraceName.SwapViewLoaded,
      'swapViewLoaded',
    );

    expect(result.unit).toBe('ms');
  });

  it('throws when the trace was never sent', () => {
    expect(() =>
      sentryTimerResult(
        [transaction(TraceName.SwapViewLoaded, 900, 1)],
        TraceName.SwapQuoteFetch,
        'swapQuoteFetch',
      ),
    ).toThrow('was not sent to Sentry');
  });

  it('throws when the last transaction failed, even after an earlier success', () => {
    expect(() =>
      sentryTimerResult(
        [
          transaction(TraceName.SwapQuoteFetch, 2100, 1),
          transaction(TraceName.SwapQuoteFetch, 300, 2, false),
        ],
        TraceName.SwapQuoteFetch,
        'swapQuoteFetch',
      ),
    ).toThrow('last completed unsuccessfully');
  });
});

describe('sentryCountResult', () => {
  it('counts every sent transaction of the named trace, failed ones included', () => {
    const transactions = [
      transaction(TraceName.SwapQuoteFetch, 400, 1),
      transaction(TraceName.SwapViewLoaded, 900, 2),
      transaction(TraceName.SwapQuoteFetch, 300, 3, false),
      transaction(TraceName.SwapQuoteFetch, 2100, 4),
    ];

    expect(
      sentryCountResult(
        transactions,
        TraceName.SwapQuoteFetch,
        'swapQuoteFetchCount',
      ),
    ).toStrictEqual({ id: 'swapQuoteFetchCount', value: 3, unit: 'count' });
  });
});
