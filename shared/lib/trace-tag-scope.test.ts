import * as Sentry from '@sentry/browser';
import { trace, traceBackgroundPoll, TraceName } from './trace';

// Real SDK: the assertions read the tags on the transactions Sentry would send.
describe('background poll controller stays on its own transaction (real SDK)', () => {
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

  it('does not carry the poll controller onto a later transaction', async () => {
    traceBackgroundPoll('StaticAssetsController', () => true);
    trace({ name: TraceName.Middleware }, () => true);
    await Sentry.flush();

    const poll = sent.find((e) => e.transaction === TraceName.BackgroundPoll);
    const later = sent.find((e) => e.transaction === TraceName.Middleware);
    expect(poll?.contexts?.trace?.data?.controller).toBe(
      'StaticAssetsController',
    );
    expect(later).toBeDefined();
    expect(later?.tags?.controller).toBeUndefined();
  });
  it('does not carry the poll controller onto a transaction started while the poll is pending', async () => {
    sent.length = 0;
    let finishPoll: () => void = () => undefined;
    const poll = traceBackgroundPoll(
      'BridgeController',
      () =>
        new Promise<void>((resolve) => {
          finishPoll = resolve;
        }),
    );
    await Promise.resolve();
    await trace({ name: TraceName.Transaction }, async () => undefined);
    finishPoll();
    await poll;
    await Sentry.flush();

    const pollEvent = sent.find(
      (e) => e.transaction === TraceName.BackgroundPoll,
    );
    const during = sent.find((e) => e.transaction === TraceName.Transaction);
    expect(pollEvent?.contexts?.trace?.data?.controller).toBe(
      'BridgeController',
    );
    expect(during).toBeDefined();
    expect(during?.tags?.controller).toBeUndefined();
    expect(during?.contexts?.trace?.data?.controller).toBeUndefined();
  });
});
