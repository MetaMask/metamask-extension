import * as Sentry from '@sentry/browser';
import { trace, traceBackgroundPoll, TraceName } from './trace';

// Real SDK: the assertions read the tags on the transactions Sentry would send.
describe('trace tags stay on their own transaction (real SDK)', () => {
  const sent: Sentry.Event[] = [];

  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [],
      beforeSendTransaction: (event) => {
        sent.push(event);
        return null;
      },
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  it('does not carry the background poll controller tag onto a later transaction', async () => {
    traceBackgroundPoll('StaticAssetsController', () => true);
    trace({ name: TraceName.Middleware }, () => true);
    await Sentry.flush();

    const poll = sent.find((e) => e.transaction === TraceName.BackgroundPoll);
    const later = sent.find((e) => e.transaction === TraceName.Middleware);
    expect(poll?.tags?.controller).toBe('StaticAssetsController');
    expect(later).toBeDefined();
    expect(later?.tags?.controller).toBeUndefined();
  });
});
