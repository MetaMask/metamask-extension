import * as Sentry from '@sentry/browser';
import type { DynamicSamplingContext, Integration } from '@sentry/core';
import {
  continueTraceContext,
  setMeasurement,
  setRootSpanAttribute,
  trace,
  TraceName,
} from '../../../shared/lib/trace';
import { getClientOptions, setCITags } from './setupSentry';

// Sentry span-payload keys, not ours.
/* eslint-disable @typescript-eslint/naming-convention */
type SentSpan = {
  name: string;
  is_segment: boolean;
  attributes: Record<string, { value: unknown; type: string; unit?: string }>;
};
/* eslint-enable @typescript-eslint/naming-convention */
type SpanItemPayload = {
  items: SentSpan[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ingest_settings?: { infer_ip?: string; infer_user_agent?: string };
};
type TransactionPayload = {
  transaction?: string;
  spans?: { description?: string }[];
};
jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({
    ci: { enabled: true, branch: 'ci-branch', commitHash: 'abc123' },
  }),
}));

type SentEnvelope = [
  { trace?: Partial<DynamicSamplingContext> },
  [{ type: string }, unknown][],
];

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
    jest.restoreAllMocks();
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
          'wallet.asset_count': 7,
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
      'wallet.asset_count': { value: 7, type: 'integer' },
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

  it('puts the CI tags on every span through the isolation scope', async () => {
    setCITags();
    trace({ name: TraceName.Transaction }, () => undefined);
    await Sentry.flush();

    const segment = sentSpans().find((span) => span.is_segment);
    expect(segment?.attributes).toMatchObject({
      'ci.enabled': { value: true, type: 'boolean' },
      'ci.branch': { value: 'ci-branch', type: 'string' },
      'ci.commitHash': { value: 'abc123', type: 'string' },
    });
  });

  // Relay derives `browser.name` and `user.geo.*` for a streamed span only
  // when the envelope allows it. Transaction events got both whatever
  // `sendDefaultPii` said. The client sets no address or user field: Relay
  // takes the geo from the connection IP, and the org's IP scrubbing removes
  // the address afterwards.
  it('lets Relay infer the browser and geo, with no address or user field set by the client', async () => {
    trace({ name: TraceName.Transaction }, () => undefined);
    await Sentry.flush();

    const spanContainers = envelopes
      .flatMap(([, items]) => items)
      .filter(([header]) => header.type === 'span')
      .map(([, payload]) => payload as SpanItemPayload);
    expect(spanContainers).not.toHaveLength(0);
    for (const container of spanContainers) {
      expect(container.ingest_settings).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        infer_ip: 'auto',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        infer_user_agent: 'auto',
      });
    }
    const attributeNames = sentSpans().flatMap((span) =>
      Object.keys(span.attributes),
    );
    expect(
      attributeNames.filter((name) => /^(client\.address|user\.)/u.test(name)),
    ).toStrictEqual([]);
  });

  // Relay infers `browser.name` for a streamed span but no OS, so the segment
  // span carries `sentry.os.name` parsed from the user agent the SDK already
  // sends. Sentry stores a bare `os.name` attribute as a tag that the `os.name`
  // field does not read.
  // The values are the ones transaction events had in production.
  const userAgentsByOs: [string, string][] = [
    [
      'Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ],
    [
      'Mac OS X',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ],
    [
      'Linux',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ],
    [
      'Ubuntu',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
    ],
    [
      'Chrome OS',
      'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ],
    [
      'Android',
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    ],
    [
      'iOS',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ],
  ];

  for (const [osName, userAgent] of userAgentsByOs) {
    it(`sets \`sentry.os.name\` ${osName} on the segment span only`, async () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(userAgent);
      trace({ name: TraceName.Transaction }, () =>
        trace({ name: 'Child' as TraceName }, () => undefined),
      );
      await Sentry.flush();

      const spans = sentSpans();
      const segment = spans.find((span) => span.is_segment);
      expect(segment?.attributes['sentry.os.name']?.value).toBe(osName);
      expect(
        spans.filter(
          (span) => !span.is_segment && 'sentry.os.name' in span.attributes,
        ),
      ).toStrictEqual([]);
      expect(
        spans.filter((span) => 'os.name' in span.attributes),
      ).toStrictEqual([]);
    });
  }

  it('sets no `sentry.os.name` for a user agent it does not recognise', async () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('curl/8');
    trace({ name: TraceName.Transaction }, () => undefined);
    await Sentry.flush();

    const segment = sentSpans().find((span) => span.is_segment);
    expect(segment?.attributes).not.toHaveProperty('sentry.os.name');
  });

  // Sentry rejects a span envelope whose `trace` header lacks `public_key`
  // (`missing_dsc`), so a continued trace must carry a complete DSC.
  it('sends the envelope of a continued UI trace with a complete `trace` header', async () => {
    const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';

    continueTraceContext(
      { traceId, parentSpanId: '00f067aa0ba902b7', parentSampled: true },
      () => Sentry.startSpan({ name: 'Background RPC: example' }, () => 1),
    );
    await Sentry.flush();

    const spanEnvelopes = envelopes.filter(([, items]) =>
      items.some(([header]) => header.type === 'span'),
    );
    expect(spanEnvelopes).not.toHaveLength(0);
    for (const [envelopeHeader] of spanEnvelopes) {
      expect(envelopeHeader.trace).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        trace_id: traceId,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        public_key: 'public',
      });
    }
  });
});
