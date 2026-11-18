import * as Sentry from '@sentry/browser';
import {
  shouldCreateSpanForRequest,
  shouldCreateSpanForRequestUnderParent,
} from './setupSentry';

const BACKEND_URL = 'https://client-config.api.cx.metamask.io/v1/flags';
const FILTERED_URL = 'https://o123.ingest.sentry.io/api/1/envelope/';

type RequestHeaders = Record<string, string>;

// Sentry span-payload keys, not ours.
/* eslint-disable @typescript-eslint/naming-convention */
type SentSpan = { name: string; span_id: string; parent_span_id?: string };
/* eslint-enable @typescript-eslint/naming-convention */
type SentEnvelope = [unknown, [{ type: string }, unknown][]];

// With streaming on, the SDK holds a request span open for up to this long
// waiting for the resource timing entry (`addHTTPTimings`), which jsdom never
// emits.
const HTTP_TIMING_FALLBACK_MS = 300;

// Runs the real fetch instrumentation, which unit tests mock, so a change that
// stops `http.client` spans fails here rather than in production span counts.
describe('http.client spans (integration with browserTracingIntegration)', () => {
  let envelopes: SentEnvelope[];
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

  const initSentry = (shouldCreateSpan: (url: string) => boolean) => {
    // The SDK refuses to init inside a browser extension unless it detects
    // NW.js; same bypass as `sentry-traces-sampler.integration.test.ts`.
    (globalThis as typeof globalThis & { nw?: object }).nw = {};
    // jsdom has no Performance Timeline; the integration's web-vitals setup
    // reads it at init.
    performance.getEntriesByType ??= () => [];

    Sentry.init({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope as SentEnvelope);
          return {};
        },
        flush: async () => true,
      }),
      tracesSampleRate: 1,
      traceLifecycle: 'stream',
      tracePropagationTargets: [/\.api\.cx\.metamask\.io/u],
      integrations: [
        Sentry.spanStreamingIntegration(),
        Sentry.browserTracingIntegration({
          instrumentPageLoad: false,
          instrumentNavigation: false,
          shouldCreateSpanForRequest: shouldCreateSpan,
        }),
      ],
    });
  };

  const settleAndGetHttpSpans = async (): Promise<SentSpan[]> => {
    await new Promise((resolve) =>
      setTimeout(resolve, HTTP_TIMING_FALLBACK_MS + 100),
    );
    await Sentry.flush();
    return envelopes
      .flatMap(([, items]) => items)
      .filter(([header]) => header.type === 'span')
      .flatMap(([, payload]) => (payload as { items: SentSpan[] }).items)
      .filter((span) => span.name.startsWith('GET '));
  };

  beforeEach(() => {
    envelopes = [];
    requestHeaders.length = 0;
  });

  afterEach(async () => {
    await Sentry.close();
  });

  it('records a fetch under an active span as its http.client child, and propagates that child', async () => {
    initSentry(shouldCreateSpanForRequestUnderParent);
    let rootSpanId = '';
    await Sentry.startSpan({ name: 'Root', op: 'test' }, async (span) => {
      rootSpanId = span.spanContext().spanId;
      await fetch(BACKEND_URL);
    });

    const httpSpans = await settleAndGetHttpSpans();
    expect(httpSpans).toHaveLength(1);
    expect(httpSpans[0].name).toBe(`GET ${BACKEND_URL}`);
    expect(httpSpans[0].parent_span_id).toBe(rootSpanId);
    // The backend parents its spans on the id in the header, so the header
    // must name the http.client span that is sent, not another id.
    expect(requestHeaders[0]['sentry-trace']).toContain(
      `-${httpSpans[0].span_id}`,
    );
  });

  it('creates no span for a URL `shouldCreateSpanForRequest` filters', async () => {
    initSentry(shouldCreateSpanForRequestUnderParent);
    await Sentry.startSpan({ name: 'Root', op: 'test' }, async () => {
      await fetch(FILTERED_URL);
    });

    expect(await settleAndGetHttpSpans()).toHaveLength(0);
    expect(requestHeaders).toHaveLength(1);
  });

  it('creates no http.client span for a fetch with no active span', async () => {
    initSentry(shouldCreateSpanForRequestUnderParent);
    await fetch(BACKEND_URL);

    expect(await settleAndGetHttpSpans()).toHaveLength(0);
    expect(requestHeaders[0]['sentry-trace']).toBeDefined();
  });

  it('would record that same fetch as a one-span trace without the active-span gate', async () => {
    // Pins why `shouldCreateSpanForRequestUnderParent` exists: in stream mode
    // the SDK emits a request span even with no active parent (`@sentry/core`
    // `fetch.ts`, `shouldEmitSpan`), where static mode emitted none.
    initSentry(shouldCreateSpanForRequest);
    await fetch(BACKEND_URL);

    const httpSpans = await settleAndGetHttpSpans();
    expect(httpSpans).toHaveLength(1);
    expect(httpSpans[0].parent_span_id).toBeUndefined();
  });
});
