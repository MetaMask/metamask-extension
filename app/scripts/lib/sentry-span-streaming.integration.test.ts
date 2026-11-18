import * as Sentry from '@sentry/browser';
import type { Integration } from '@sentry/core';
import { getClientOptions } from './setupSentry';

type SpanItemPayload = { items: { name: string }[] };
type TransactionPayload = {
  transaction?: string;
  spans?: { description?: string }[];
};
type SentEnvelope = [unknown, [{ type: string }, unknown][]];

// Uses the options `setupSentry` ships and the real SDK, so a change back to
// `traceLifecycle: 'static'` fails here. In static mode a child still running
// when its root ends is dropped with the root's transaction, and the only way
// to send it was to write the SDK's private `_isStandaloneSpan` on it.
describe('span streaming (integration with the shipped Sentry options)', () => {
  let envelopes: SentEnvelope[];

  // Names of every span that reached the transport, whether it travelled as a
  // streamed span item or inside a transaction event.
  const sentSpanNames = () =>
    envelopes
      .flatMap(([, items]) => items)
      .flatMap(([header, payload]) => {
        if (header.type === 'span') {
          return (payload as SpanItemPayload).items.map((span) => span.name);
        }
        if (header.type === 'transaction') {
          const { transaction, spans = [] } = payload as TransactionPayload;
          return [transaction, ...spans.map((span) => span.description)];
        }
        return [];
      });

  beforeEach(() => {
    envelopes = [];
    // The SDK refuses to init inside a browser extension unless it detects
    // NW.js; same bypass as `sentry-http-client-spans.integration.test.ts`.
    (globalThis as typeof globalThis & { nw?: object }).nw = {};
    // jsdom has no Performance Timeline; the integration's web-vitals setup
    // reads it at init.
    performance.getEntriesByType ??= () => [];

    const options = getClientOptions();

    Sentry.init({
      ...options,
      // Without MetaMetrics consent it drops every transaction event, which
      // would make the static-mode run fail because nothing is sent at all
      // rather than because the child is missing. The custom transport still
      // gates sending on consent in production, and is replaced below.
      integrations: (options.integrations as Integration[]).filter(
        (integration) => integration.name !== 'MetaMetrics',
      ),
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope as SentEnvelope);
          return {};
        },
        flush: async () => true,
      }),
      tracesSampleRate: 1,
      tracesSampler: undefined,
    });
  });

  afterEach(async () => {
    await Sentry.close();
  });

  it('sends a child that ends after its root as a span, without marking it standalone', async () => {
    const root = Sentry.startInactiveSpan({
      name: 'Root',
      op: 'test',
      forceTransaction: true,
    });
    const child = Sentry.startInactiveSpan({
      name: 'Child',
      op: 'test',
      parentSpan: root,
    });

    root.end();
    child.end();
    await Sentry.flush();

    expect(sentSpanNames()).toStrictEqual(
      expect.arrayContaining(['Root', 'Child']),
    );
    expect(Reflect.get(child, '_isStandaloneSpan')).toBeFalsy();
  });
});
