import * as Sentry from '@sentry/browser';
import { continueTraceContext } from '../../../shared/lib/trace';
import {
  BACKEND_TRACE_PROPAGATION_TARGETS,
  consensysTracePropagationIntegration,
} from './sentry-trace-propagation';

/**
 * Pins what a backend request carries when the background continues a trace
 * that started in the UI. Backends stamp `sentry.sampled` from the request's
 * `sentry-sampled` baggage entry and route spans to Sentry on it, so a sampled
 * `traceparent` without that entry loses the backend half of the trace.
 * Uses the real SDK; only `fetch` and the transport are stubbed.
 */

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const PARENT_SPAN_ID = '00f067aa0ba902b7';
const BACKEND_URL = 'https://on-ramp.api.cx.metamask.io/geolocation';

const sent: Headers[] = [];

function baggageEntries(headers: Headers): string[] {
  return (headers.get('baggage') ?? '').split(',').map((entry) => entry.trim());
}

describe('continueTraceContext outbound baggage', () => {
  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    (globalThis as { fetch: unknown }).fetch = jest.fn(
      async (_input: unknown, init?: RequestInit) => {
        sent.push(new Headers(init?.headers as HeadersInit | undefined));
        return new Response('{}', { status: 200 });
      },
    );
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [
        Sentry.browserTracingIntegration({
          instrumentPageLoad: false,
          instrumentNavigation: false,
        }),
        consensysTracePropagationIntegration({ log: () => undefined }),
      ],
      tracePropagationTargets: BACKEND_TRACE_PROPAGATION_TARGETS,
      propagateTraceparent: true,
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  beforeEach(() => {
    sent.length = 0;
  });

  afterAll(() => {
    delete (globalThis as { sentry?: unknown }).sentry;
  });

  it('sends sentry-sampled=true in the continued trace from a sampled UI parent', async () => {
    await continueTraceContext(
      { traceId: TRACE_ID, parentSpanId: PARENT_SPAN_ID, parentSampled: true },
      () =>
        Sentry.startSpan({ name: 'Background RPC: example' }, () =>
          fetch(BACKEND_URL),
        ),
    );

    expect(sent).toHaveLength(1);
    expect(sent[0].get('traceparent')).toMatch(
      new RegExp(`^00-${TRACE_ID}-[0-9a-f]{16}-[0-9a-f]{2}$`, 'u'),
    );
    expect(baggageEntries(sent[0])).toContain('sentry-sampled=true');
  });

  it('sends sentry-sampled=false from an unsampled UI parent', async () => {
    await continueTraceContext(
      { traceId: TRACE_ID, parentSpanId: PARENT_SPAN_ID, parentSampled: false },
      () =>
        Sentry.startSpan({ name: 'Background RPC: example' }, () =>
          fetch(BACKEND_URL),
        ),
    );

    expect(sent).toHaveLength(1);
    expect(baggageEntries(sent[0])).toContain('sentry-sampled=false');
  });
});
