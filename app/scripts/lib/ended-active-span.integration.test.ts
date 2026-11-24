import * as Sentry from '@sentry/browser';
import {
  _INTERNAL_setSpanForScope as setSpanForScope,
  getDefaultCurrentScope,
} from '@sentry/core';
import { trace, TraceName } from '../../../shared/lib/trace';
import { shouldCreateSpanForRequest } from './setupSentry';
import {
  BACKEND_TRACE_PROPAGATION_TARGETS,
  consensysTracePropagationIntegration,
} from './sentry-trace-propagation';
import { withOwnRootTrace } from './own-root-trace';

const BACKEND_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

// The browser SDK's scope stack pops in settlement order, not push order: when
// a root settles before a root started after it, the first root's span stays
// active after it has ended, until the second settles.
describe('work under an ended active span (real SDK)', () => {
  const requestHeaders: Record<string, string>[] = [];
  const originalFetch = globalThis.fetch;
  let releaseLater: () => void;
  let later: Promise<void>;

  beforeAll(() => {
    // Wrapped once per process by the SDK, so installed before the first init.
    globalThis.fetch = jest.fn(async (_input, init?: RequestInit) => {
      requestHeaders.push(Object.fromEntries(new Headers(init?.headers)));
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    requestHeaders.length = 0;
    // Lets `Sentry.init` run in jsdom, which it takes for an embedded extension.
    (globalThis as { nw?: object }).nw = {};
    performance.getEntriesByType ??= () => [];
    (globalThis as { sentry?: unknown }).sentry = Sentry;
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
  });

  afterEach(async () => {
    releaseLater?.();
    await later;
    await Sentry.close();
  });

  // Leaves the earlier root's span active and ended; returns its trace id.
  async function endEarlierRootFirst(): Promise<string> {
    let releaseEarlier: () => void = () => undefined;
    let earlierTraceId = '';
    const earlier = trace(
      { name: TraceName.RampsInit, root: true },
      (span) =>
        new Promise<void>((resolve) => {
          earlierTraceId = (span as Sentry.Span).spanContext().traceId;
          releaseEarlier = resolve;
        }),
    );
    later = trace(
      { name: TraceName.PhishingListsUpdate, root: true },
      () =>
        new Promise<void>((resolve) => {
          releaseLater = resolve;
        }),
    );
    releaseEarlier();
    await earlier;

    const active = Sentry.getActiveSpan() as Sentry.Span;
    expect(active.spanContext().traceId).toBe(earlierTraceId);
    expect(Sentry.spanToJSON(active).timestamp).toBeDefined();
    return earlierTraceId;
  }

  it('sends no trace headers naming the ended span', async () => {
    const endedTraceId = await endEarlierRootFirst();

    await fetch(BACKEND_URL);

    expect(requestHeaders).toHaveLength(1);
    expect(requestHeaders[0].traceparent ?? '').not.toContain(endedTraceId);
    expect(requestHeaders[0]['sentry-trace']).toBeUndefined();
  });

  it('names the running pageload when the active span has ended', async () => {
    // The pageload sits on the base scope, below every operation's scope.
    const pageload = Sentry.startInactiveSpan({
      name: '/service-worker.js',
      forceTransaction: true,
    });
    setSpanForScope(getDefaultCurrentScope(), pageload);
    const endedTraceId = await endEarlierRootFirst();

    try {
      await fetch(BACKEND_URL);
    } finally {
      setSpanForScope(getDefaultCurrentScope(), undefined);
      pageload.end();
    }

    const pageloadTraceId = pageload.spanContext().traceId;
    expect(pageloadTraceId).not.toBe(endedTraceId);
    expect(requestHeaders).toHaveLength(1);
    expect(requestHeaders[0].traceparent).toContain(pageloadTraceId);
    expect(requestHeaders[0]['sentry-trace']).toContain(pageloadTraceId);
    expect(requestHeaders[0].baggage).toContain('consensys-request-id=');
  });

  it('starts an operation as its own root', async () => {
    const endedTraceId = await endEarlierRootFirst();
    let rootName: string | undefined;

    await withOwnRootTrace(TraceName.GeolocationFetch, async () => {
      const span = Sentry.getActiveSpan() as Sentry.Span;
      rootName = Sentry.spanToJSON(Sentry.getRootSpan(span)).description;
      await fetch(BACKEND_URL);
    })();

    expect(rootName).toBe(TraceName.GeolocationFetch);
    expect(requestHeaders[0].traceparent).toMatch(/^00-[0-9a-f]{32}-/u);
    expect(requestHeaders[0].traceparent).not.toContain(endedTraceId);
  });
});
