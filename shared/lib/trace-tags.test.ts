import * as Sentry from '@sentry/browser';
import { SwapFeatureTag } from '@metamask/bridge-controller';
import { endTrace, trace, TraceName } from './trace';

type SentEvent = { name?: string; tags?: Record<string, unknown> };

describe('trace tags', () => {
  let sent: SentEvent[];
  let client: Sentry.BrowserClient;

  beforeEach(() => {
    sent = [];
    client = new Sentry.BrowserClient({
      dsn: 'https://public@o0.ingest.sentry.io/0',
      integrations: [],
      tracesSampleRate: 1,
      stackParser: Sentry.defaultStackParser,
      transport: () => ({
        send: async () => ({}),
        flush: async () => true,
      }),
      beforeSend: (event) => {
        sent.push({
          name: event.exception?.values?.[0]?.value,
          tags: event.tags,
        });
        return null;
      },
      traceLifecycle: 'static',
      beforeSendTransaction: (event) => {
        sent.push({ name: event.transaction, tags: event.tags });
        return null;
      },
    });
    Sentry.getIsolationScope().setTag('feature', undefined);
    Sentry.getCurrentScope().setClient(client);
    client.init();
    globalThis.sentry = Sentry as unknown as typeof globalThis.sentry;
  });

  afterEach(() => {
    globalThis.sentry = undefined;
  });

  const tagsOf = (name: string) =>
    sent.find((event) => event.name === name)?.tags;

  it('keeps a trace tag off later events that set none', async () => {
    trace(
      { name: TraceName.Transaction, tags: { feature: 'swap' } },
      () => undefined,
    );
    trace({ name: TraceName.HomepageReady }, () => undefined);
    Sentry.captureException(new Error('unrelated failure'));
    await client.flush(500);

    expect(tagsOf(TraceName.Transaction)).toStrictEqual({
      feature: 'swap',
    });
    expect(tagsOf(TraceName.HomepageReady)?.feature).toBeUndefined();
    expect(tagsOf('unrelated failure')?.feature).toBeUndefined();
  });

  it('keeps the tag a started trace was given when another trace ends first', async () => {
    trace({
      name: TraceName.BatchSellModal,
      tags: { feature: SwapFeatureTag.BATCH_SELL },
    });
    trace(
      { name: TraceName.Transaction, tags: { feature: 'swap' } },
      () => undefined,
    );
    endTrace({ name: TraceName.BatchSellModal });
    await client.flush(500);

    expect(tagsOf(TraceName.BatchSellModal)).toStrictEqual({
      feature: 'batch_sell',
    });
  });
});
