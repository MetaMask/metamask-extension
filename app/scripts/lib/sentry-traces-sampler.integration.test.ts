import * as Sentry from '@sentry/browser';
import {
  applySentryRemoteRates,
  resetSentryRemoteRates,
} from '../../../shared/lib/sentry-remote-rates';
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
 * Seed the remote-rate module cache the way production does — through
 * `applySentryRemoteRates` reading persisted state — rather than by reaching
 * into the module. Going through the real entry point means these cases also
 * cover the read path, not just the sampler's use of its result.
 *
 * @param sentryFlag - The `sentry` remote flag value to serve.
 */
async function seedRemoteRates(sentryFlag: unknown) {
  globalThis.stateHooks = {
    getPersistedState: async () => ({
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: { sentry: sentryFlag },
        },
      },
    }),
    getSentryState: () => ({ browser: '', version: '' }),
  };
  const options: { tracesSampleRate?: number } = { tracesSampleRate: 1 };
  await applySentryRemoteRates({ getOptions: () => options });
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
      tracesSampler: createTracesSampler({
        defaultSampleRate: 1,
      }),
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
    resetSentryRemoteRates();
    // @ts-expect-error test cleanup of the global hook
    delete globalThis.stateHooks;
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

  it('caps a per-name override above the remote ceiling, through the real SDK', async () => {
    // Isolating the ceiling needs a case where the default rate would ALLOW and
    // the ceiling BLOCKS. A per-name override of 1 under a ceiling of 0 is one
    // such case (a positive parent decision under a ceiling of 0 is another,
    // covered in the unit file), and it is needed because `createTracesSampler`
    // feeds
    // the remote rate in as BOTH the default and the ceiling — so any assertion
    // resting on the default being 0 passes with the ceiling removed entirely,
    // and tests nothing. Verified by mutation: neutralising the ceiling turns
    // this case red.
    await seedRemoteRates({
      tracesSampleRate: 0,
      transactionSampleRates: { 'Boosted Transaction': 1 },
    });

    Sentry.startSpan(
      { name: 'Boosted Transaction', forceTransaction: true },
      () => undefined,
    );
    await Sentry.flush(2000);

    // min(1, 0) = 0. Without the ceiling the per-name 1 would be honoured and
    // this transaction would be sent.
    expect(sentTransactions).not.toContain('Boosted Transaction');
  });

  it('lets a remote per-name override un-pin a build-time zero through the real SDK', async () => {
    // `Throttled Transaction` is pinned to 0 by the build-time env override set
    // in beforeEach. The remote map raises it, which the unit tests assert as a
    // pure function; this asserts the SDK actually emits it. The remote global
    // rate is 1 so the ceiling is not what decides the outcome.
    await seedRemoteRates({
      tracesSampleRate: 1,
      transactionSampleRates: { 'Throttled Transaction': 1 },
    });

    Sentry.startSpan(
      { name: 'Throttled Transaction', forceTransaction: true },
      () => undefined,
    );
    await Sentry.flush(2000);

    expect(sentTransactions).toContain('Throttled Transaction');
  });
});
