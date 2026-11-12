import * as Sentry from '@sentry/browser';
import { getScuttleGlobalThisExceptions } from '../../../development/webpack/utils/plugins/LavamoatPlugin';
import { shouldCreateSpanForRequest } from './setupSentry';
import {
  BACKEND_TRACE_PROPAGATION_TARGETS,
  consensysTracePropagationIntegration,
} from './sentry-trace-propagation';

const BACKEND_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

// Browser globals the SDK reads on the fetch-header path:
// `shouldAttachHeaders` calls `new URL(target, location.href)` whenever
// `location.href` exists (the UI; the service worker has none), and the header
// merge tests `instanceof Headers`.
const SDK_FETCH_HEADER_GLOBALS = ['URL', 'Headers', 'Request'];

// Captured before any test scuttles `Headers`, for the fetch stub below.
const UnscuttledHeaders = Headers;

type RequestHeaders = Record<string, string>;

// Makes each global throw on read, as LavaMoat's `scuttleGlobalThis` does.
// Returns a function restoring the originals.
function scuttle(names: string[]): () => void {
  const originals = names.map((name) => ({
    name,
    descriptor: Object.getOwnPropertyDescriptor(globalThis, name),
  }));
  for (const name of names) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        throw new Error(
          `LavaMoat - property "${name}" of globalThis is inaccessible under scuttling mode`,
        );
      },
      set() {
        throw new Error(
          `LavaMoat - property "${name}" of globalThis is inaccessible under scuttling mode`,
        );
      },
    });
  }
  return () => {
    for (const { name, descriptor } of originals) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      }
    }
  };
}

// Real fetch instrumentation, `browserTracingIntegration` with the production
// `shouldCreateSpanForRequest`, and the production propagation integration,
// under the UI's scuttling exceptions.
describe('UI fetch trace headers under LavaMoat scuttling', () => {
  const requestHeaders: RequestHeaders[] = [];
  const originalFetch = globalThis.fetch;
  let restoreGlobals: () => void;

  beforeAll(() => {
    // Wrapped once per process by the SDK, so installed before the first init.
    globalThis.fetch = jest.fn(async (_input, init?: RequestInit) => {
      requestHeaders.push(
        Object.fromEntries(new UnscuttledHeaders(init?.headers).entries()),
      );
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    requestHeaders.length = 0;
    (globalThis as typeof globalThis & { nw?: object }).nw = {};
    performance.getEntriesByType ??= () => [];

    Sentry.init({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({ send: async () => ({}), flush: async () => true }),
      tracesSampleRate: 1,
      tracePropagationTargets: BACKEND_TRACE_PROPAGATION_TARGETS,
      propagateTraceparent: true,
      integrations: [
        Sentry.browserTracingIntegration({
          instrumentPageLoad: false,
          instrumentNavigation: false,
          shouldCreateSpanForRequest,
        }),
        consensysTracePropagationIntegration({ log: () => undefined }),
      ],
    });

    const exceptions = getScuttleGlobalThisExceptions({} as never);
    const scuttled = SDK_FETCH_HEADER_GLOBALS.filter(
      (name) => !exceptions.includes(name),
    );
    restoreGlobals = scuttle(scuttled);
  });

  afterEach(async () => {
    restoreGlobals();
    await Sentry.close();
  });

  it('propagates the http.client span as traceparent, with sampled baggage', async () => {
    let httpClientSpanId: string | undefined;
    Sentry.getClient()?.on('spanStart', (span) => {
      if (Sentry.spanToJSON(span).op === 'http.client') {
        httpClientSpanId = span.spanContext().spanId;
      }
    });

    await Sentry.startSpan({ name: 'Root', op: 'test' }, async () => {
      await fetch(BACKEND_URL);
    });

    expect(httpClientSpanId).toBeDefined();
    expect(requestHeaders).toHaveLength(1);
    expect(requestHeaders[0].traceparent).toMatch(
      new RegExp(`^00-[0-9a-f]{32}-${httpClientSpanId}-01$`, 'u'),
    );
    expect(requestHeaders[0]['sentry-trace']).toContain(
      `-${httpClientSpanId}-`,
    );
    expect(requestHeaders[0].baggage).toContain('sentry-sampled=true');
    expect(requestHeaders[0].baggage).toContain('consensys-request-id=');
  });

  it('sends no trace headers with no active span', async () => {
    await fetch(BACKEND_URL);

    expect(requestHeaders).toHaveLength(1);
    expect(requestHeaders[0]['sentry-trace']).toBeUndefined();
    expect(requestHeaders[0].traceparent).toBeUndefined();
    expect(requestHeaders[0].baggage ?? '').not.toContain('sentry-');
  });
});
