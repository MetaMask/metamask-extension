import * as Sentry from '@sentry/browser';
import { createTracesSampler } from './sentry-traces-sampler';

/**
 * No-op transport so `Sentry.init` never touches the network. Sampling
 * decisions are read from `beforeSendTransaction` instead: a transaction that
 * was sampled out never reaches it.
 */
function stubTransport() {
  return {
    send: async () => ({}),
    flush: async () => true,
  } as unknown as ReturnType<typeof Sentry.makeFetchTransport>;
}

/**
 * Integration coverage: proves the sampler actually wires into the real
 * `@sentry/browser` SDK (the unit tests only exercise the pure decision against
 * a hand-rolled context). Grounded in Sentry data showing ~97% of the target
 * spans are trace roots, where `tracesSampler` fires.
 */
describe('createTracesSampler (integration with Sentry.init)', () => {
  let sentTransactions: string[];
  const originalEnv = process.env.SENTRY_SAMPLE_RATE_OVERRIDES;

  beforeEach(() => {
    sentTransactions = [];
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = JSON.stringify({
      'Throttled Transaction': 0,
    });
    (globalThis as typeof globalThis & { nw?: object }).nw = {};

    Sentry.init({
      dsn: 'https://public@fake.ingest.sentry.io/1',
      release: 'traces-sampler-integration-test',
      transport: stubTransport,
      tracesSampler: createTracesSampler({ defaultSampleRate: 1 }),
      beforeSendTransaction: (event) => {
        if (event.transaction) {
          sentTransactions.push(event.transaction);
        }
        // Record only; drop before any network/transport work.
        return null;
      },
    });
  });

  afterEach(async () => {
    await Sentry.close(2000);
    if (originalEnv === undefined) {
      delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
    } else {
      process.env.SENTRY_SAMPLE_RATE_OVERRIDES = originalEnv;
    }
  });

  it('drops a throttled root transaction and keeps a non-throttled one', async () => {
    Sentry.startSpan(
      { name: 'Throttled Transaction', forceTransaction: true },
      () => undefined,
    );
    Sentry.startSpan(
      { name: 'Kept Transaction', forceTransaction: true },
      () => undefined,
    );
    await Sentry.flush(2000);

    expect(sentTransactions).toContain('Kept Transaction');
    expect(sentTransactions).not.toContain('Throttled Transaction');
  });

  it('re-consults the sampler for forced transactions, so a throttled name is dropped even nested under a sampled parent', async () => {
    Sentry.startSpan({ name: 'Parent Trace' }, () => {
      Sentry.startSpan(
        { name: 'Throttled Transaction', forceTransaction: true },
        () => undefined,
      );
      Sentry.startSpan(
        { name: 'Nested Kept Transaction', forceTransaction: true },
        () => undefined,
      );
    });
    await Sentry.flush(2000);

    // The non-throttled root and the non-throttled nested forced transaction are
    // both sent; the throttled forced transaction is dropped by name even though
    // its parent trace was sampled. `forceTransaction` re-consults
    // `tracesSampler`, so the throttle reaches nested fan-out, not just roots.
    expect(sentTransactions).toContain('Parent Trace');
    expect(sentTransactions).toContain('Nested Kept Transaction');
    expect(sentTransactions).not.toContain('Throttled Transaction');
  });
});
