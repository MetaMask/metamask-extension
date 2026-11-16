import * as Sentry from '@sentry/browser';
import type { TransactionEvent } from '@sentry/core';
import { shouldCreateSpanForRequest } from './setupSentry';

const BACKEND_URL = 'https://client-config.api.cx.metamask.io/v1/flags';
const FILTERED_URL = 'https://o123.ingest.sentry.io/api/1/envelope/';

type RequestHeaders = Record<string, string>;

// Runs the real fetch instrumentation, which unit tests mock, so a change that
// stops `http.client` spans fails here rather than in production span counts.
describe('http.client spans (integration with browserTracingIntegration)', () => {
  let sent: TransactionEvent[];
  const requestHeaders: RequestHeaders[] = [];
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    // Installed once, before the first `Sentry.init`: the SDK wraps
    // `globalThis.fetch` only once per process, so a stub swapped in later
    // would run unwrapped and every assertion below would pass vacuously.
    globalThis.fetch = jest.fn(async (_input, init?: RequestInit) => {
      requestHeaders.push(
        Object.fromEntries(new Headers(init?.headers).entries()),
      );
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    sent = [];
    requestHeaders.length = 0;
    // The SDK refuses to init inside a browser extension unless it detects
    // NW.js; same bypass as `sentry-traces-sampler.integration.test.ts`.
    (globalThis as typeof globalThis & { nw?: object }).nw = {};
    // jsdom has no Performance Timeline; the integration's web-vitals setup
    // reads it at init.
    performance.getEntriesByType ??= () => [];

    Sentry.init({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: async () => ({}),
        flush: async () => true,
      }),
      tracesSampleRate: 1,
      tracePropagationTargets: [/\.api\.cx\.metamask\.io/u],
      integrations: [
        Sentry.browserTracingIntegration({
          instrumentPageLoad: false,
          instrumentNavigation: false,
          shouldCreateSpanForRequest,
        }),
      ],
      beforeSendTransaction: (event) => {
        sent.push(event);
        return null;
      },
    });
  });

  afterEach(async () => {
    await Sentry.close();
  });

  it('records a fetch under an active span as its http.client child, and propagates that child', async () => {
    let rootSpanId = '';
    await Sentry.startSpan({ name: 'Root', op: 'test' }, async (span) => {
      rootSpanId = span.spanContext().spanId;
      await fetch(BACKEND_URL);
    });
    await Sentry.flush();

    const httpSpans = sent.flatMap((event) =>
      (event.spans ?? []).filter((span) => span.op === 'http.client'),
    );
    expect(httpSpans).toHaveLength(1);
    expect(httpSpans[0].description).toBe(`GET ${BACKEND_URL}`);
    expect(httpSpans[0].parent_span_id).toBe(rootSpanId);
    // The backend parents its spans on the id in the header, so the header
    // must name the http.client span that is sent, not another id.
    expect(requestHeaders[0]['sentry-trace']).toContain(
      `-${httpSpans[0].span_id}`,
    );
  });

  it('creates no span for a URL `shouldCreateSpanForRequest` filters', async () => {
    await Sentry.startSpan({ name: 'Root', op: 'test' }, async () => {
      await fetch(FILTERED_URL);
    });
    await Sentry.flush();

    expect(requestHeaders).toHaveLength(1);
    expect(sent).toHaveLength(1);
    expect(
      sent.flatMap((event) =>
        (event.spans ?? []).filter((span) => span.op === 'http.client'),
      ),
    ).toHaveLength(0);
  });

  it('creates no http.client span for a fetch with no active span', async () => {
    // The SDK starts a request span only under an active parent
    // (`@sentry/core` `fetch.ts`, `hasParent`). Pinned so a change in either
    // direction is seen: code that fetches outside a span records no
    // network spans.
    await fetch(BACKEND_URL);
    await Sentry.flush();

    expect(sent).toHaveLength(0);
    expect(requestHeaders[0]['sentry-trace']).toBeDefined();
  });
});
