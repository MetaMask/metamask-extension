import * as Sentry from '@sentry/browser';
import type { Integration } from '@sentry/core';
import {
  setMeasurement,
  setRootSpanAttribute,
  trace,
  TraceName,
} from '../../../shared/lib/trace';
import { getClientOptions } from './setupSentry';

// Sentry span-payload keys, not ours.
/* eslint-disable @typescript-eslint/naming-convention */
type SentSpan = {
  name: string;
  is_segment: boolean;
  attributes: Record<string, { value: unknown; type: string; unit?: string }>;
};
/* eslint-enable @typescript-eslint/naming-convention */
type SpanItemPayload = { items: SentSpan[] };
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

  const sentSpans = (): SentSpan[] =>
    envelopes
      .flatMap(([, items]) => items)
      .filter(([header]) => header.type === 'span')
      .flatMap(([, payload]) => (payload as SpanItemPayload).items);

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

    (globalThis as { sentry?: unknown }).sentry = Sentry;

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
    delete (globalThis as { sentry?: unknown }).sentry;
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

  // Streamed spans carry no tags or measurements, so the values dashboards
  // read as `tags[...]` and `measurements.*` must be attributes.
  it("sends a trace request's tags and a measurement as attributes on the spans", async () => {
    trace(
      {
        name: TraceName.Transaction,
        tags: {
          'wallet.token_count': 7,
          'wallet.unlocked': true,
          'wallet.ui_type': 'popup',
        },
        data: { extra: 'x' },
      },
      () => {
        setMeasurement('tbt', 150, 'millisecond');
        setRootSpanAttribute('tbt.rating', 'good');
      },
    );
    await Sentry.flush();

    const segment = sentSpans().find((span) => span.is_segment);
    expect(segment?.name).toBe(TraceName.Transaction);
    expect(segment?.attributes).toMatchObject({
      'wallet.token_count': { value: 7, type: 'integer' },
      'wallet.unlocked': { value: true, type: 'boolean' },
      'wallet.ui_type': { value: 'popup', type: 'string' },
      extra: { value: 'x', type: 'string' },
      tbt: { value: 150, type: 'integer', unit: 'millisecond' },
      'tbt.rating': { value: 'good', type: 'string' },
    });
  });

  it('puts the trace id on the segment span as `otelTraceId`', async () => {
    trace({ name: TraceName.Transaction }, () => undefined);
    await Sentry.flush();

    const segment = sentSpans().find((span) => span.is_segment);
    expect(segment?.attributes.otelTraceId.value).toMatch(/^[0-9a-f]{32}$/u);
  });
});
