import { TraceName } from '../../../../shared/lib/trace';
import type { SentryTransaction } from './sentry-transactions';
import {
  describeSpanBreakdown,
  parseEnvelopeTransactions,
  sentryCountResult,
  sentryInitialTimerResult,
  sentryTimerResult,
  spansDuring,
} from './sentry-transactions';

function transactionItem(
  name: string,
  startSeconds: number,
  endSeconds: number,
  trace: Record<string, unknown> = {},
  spans?: unknown,
): string[] {
  return [
    JSON.stringify({ type: 'transaction' }),
    JSON.stringify({
      transaction: name,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      start_timestamp: startSeconds,
      timestamp: endSeconds,
      contexts: { trace },
      ...(spans !== undefined && { spans }),
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

describe('sentryInitialTimerResult', () => {
  const QUOTE = TraceName.SwapQuoteFetch;

  it('times the non-refresh completion, not the last one', () => {
    const transactions: SentryTransaction[] = [
      { ...transaction(QUOTE, 450, 1), isRefresh: false },
      { ...transaction(QUOTE, 337, 2), isRefresh: true },
    ];

    expect(
      sentryInitialTimerResult(transactions, QUOTE, 'swapQuoteFetchInitial'),
    ).toStrictEqual({ id: 'swapQuoteFetchInitial', value: 450, unit: 'ms' });
    // The control: the positional selector takes the refresh.
    expect(
      sentryTimerResult(transactions, QUOTE, 'swapQuoteFetch'),
    ).toStrictEqual({ id: 'swapQuoteFetch', value: 337, unit: 'ms' });
  });

  it('falls back to the last completion when no transaction carries the attribute', () => {
    const transactions = [
      transaction(QUOTE, 450, 1),
      transaction(QUOTE, 337, 2),
    ];

    expect(
      sentryInitialTimerResult(transactions, QUOTE, 'swapQuoteFetchInitial'),
    ).toStrictEqual({ id: 'swapQuoteFetchInitial', value: 337, unit: 'ms' });
  });

  it('throws when the initial completion was unsuccessful', () => {
    const transactions: SentryTransaction[] = [
      { ...transaction(QUOTE, 450, 1, false), isRefresh: false },
      { ...transaction(QUOTE, 337, 2), isRefresh: true },
    ];

    expect(() =>
      sentryInitialTimerResult(transactions, QUOTE, 'swapQuoteFetchInitial'),
    ).toThrow('initial completion was unsuccessful');
  });

  it('parses isRefresh off the envelope, on the same path as result', () => {
    const body = envelope(
      transactionItem(QUOTE, 1, 1.45, {
        status: 'ok',
        data: { isRefresh: false, result: 'success' },
      }),
    );

    const [parsed] = parseEnvelopeTransactions(body);
    expect(parsed.isRefresh).toBe(false);
    expect(parsed.result).toBe('success');
  });
});

describe('child spans', () => {
  const DETAILS = TraceName.AssetDetails;

  /* eslint-disable @typescript-eslint/naming-convention */
  const childSpan = (
    op: string,
    description: string,
    startSeconds: number,
    endSeconds: number,
  ) => ({
    span_id: `${op}-${startSeconds}`,
    parent_span_id: 'root',
    op,
    description,
    start_timestamp: startSeconds,
    timestamp: endSeconds,
  });
  /* eslint-enable @typescript-eslint/naming-convention */

  it('keeps each transaction child span and its own span id', () => {
    const body = envelope(
      transactionItem(
        DETAILS,
        100,
        101.5,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { span_id: 'root' },
        [
          childSpan(
            'ui.long-animation-frame',
            'Main UI thread blocked',
            100.25,
            100.75,
          ),
        ],
      ),
    );

    const [parsed] = parseEnvelopeTransactions(body);

    expect(parsed.spanId).toBe('root');
    expect(parsed.spans).toHaveLength(1);
    expect(parsed.spans?.[0]).toMatchObject({
      spanId: 'ui.long-animation-frame-100.25',
      parentSpanId: 'root',
      op: 'ui.long-animation-frame',
      description: 'Main UI thread blocked',
      startTimestamp: 100.25,
      endTimestamp: 100.75,
    });
    expect(parsed.spans?.[0].durationMs).toBeCloseTo(500, 6);
  });

  it('skips a child span without numeric timestamps, and omits an empty list', () => {
    const body = envelope(
      transactionItem(DETAILS, 100, 101, {}, [
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { op: 'http.client', start_timestamp: 100.1 },
        'not a span',
      ]),
    );

    expect(parseEnvelopeTransactions(body)[0]).not.toHaveProperty('spans');
  });

  it('places every overlapping child span, from any transaction, on the target timeline', () => {
    const transactions = parseEnvelopeTransactions(
      envelope(
        transactionItem(DETAILS, 100, 101, {}, [
          childSpan('ui.render', 'own child', 100.5, 100.6),
        ]),
        transactionItem('/home.html', 99, 103, {}, [
          childSpan(
            'ui.long-animation-frame',
            'before and into it',
            99.9,
            100.2,
          ),
          childSpan('http.client', 'GET historical-prices', 100.1, 100.9),
          childSpan('http.client', 'after it', 101.2, 101.4),
          childSpan('ui.long-animation-frame', 'before it', 99.0, 99.5),
        ]),
      ),
    );
    const target = transactions.find(
      (item) => item.name === DETAILS,
    ) as SentryTransaction;

    const rows = spansDuring(transactions, target);

    expect(rows.map((row) => row.description)).toStrictEqual([
      'before and into it',
      'GET historical-prices',
      'own child',
    ]);
    expect(rows.map((row) => row.transaction)).toStrictEqual([
      '/home.html',
      '/home.html',
      DETAILS,
    ]);
    expect(rows[0].startOffsetMs).toBeCloseTo(-100, 6);
    expect(rows[1].startOffsetMs).toBeCloseTo(100, 6);
    expect(rows[1].durationMs).toBeCloseTo(800, 6);
  });

  it('describes the last completion of the trace and the spans inside it', () => {
    const transactions = parseEnvelopeTransactions(
      envelope(
        transactionItem(DETAILS, 10, 10.2),
        transactionItem(DETAILS, 100, 101.5, {}, [
          childSpan('http.client', 'GET prices', 100.25, 101.25),
        ]),
      ),
    );

    expect(describeSpanBreakdown(transactions, DETAILS)).toBe(
      'Asset Details 1500.0 ms: 1 child spans inside it, from 2 transactions read: +250.0 ms 1000.0 ms http.client "GET prices" [Asset Details]',
    );
  });

  it('says so when the trace has no child spans, or was not sent', () => {
    const sent = parseEnvelopeTransactions(
      envelope(transactionItem(DETAILS, 100, 100.5)),
    );

    expect(describeSpanBreakdown(sent, DETAILS)).toBe(
      'Asset Details 500.0 ms: 0 child spans inside it, from 1 transactions read',
    );
    expect(describeSpanBreakdown([], DETAILS)).toBe(
      'Asset Details: not sent (0 transactions read)',
    );
  });
});
