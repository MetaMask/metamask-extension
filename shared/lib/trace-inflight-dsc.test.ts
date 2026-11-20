import * as Sentry from '@sentry/browser';
import type { Envelope } from '@sentry/types';
import { trace, TraceName } from './trace';

// Real SDK, not mocks: the SDK leaves the `trace` header off a standalone span
// envelope when its root's frozen DSC has no `public_key`.
describe('standalone children of a root that ended first (real SDK)', () => {
  const PUBLIC_KEY = 'publickey0123456789';
  const PARENT_TRACE_ID = '0123456789abcdef0123456789abcdef';
  let envelopes: Envelope[];

  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  beforeEach(() => {
    envelopes = [];
    const client = new Sentry.BrowserClient({
      dsn: `https://${PUBLIC_KEY}@example.ingest.sentry.io/1`,
      environment: 'test',
      release: '1.2.3',
      transport: () => ({
        send: (envelope: Envelope) => {
          envelopes.push(envelope);
          return Promise.resolve({});
        },
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [],
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
  });

  /**
   * Read the `trace` header sent with a child that outlived its root.
   *
   * @param continued - Whether the root continues another process's trace.
   */
  function standaloneChildTraceHeader(continued: boolean) {
    const parentContext = continued
      ? {
          traceId: PARENT_TRACE_ID,
          parentSpanId: '0123456789abcdef',
          parentSampled: true,
        }
      : undefined;
    const child = trace(
      { name: TraceName.ContactSyncUpdateRemote, parentContext },
      (root) =>
        Sentry.startInactiveSpan({
          name: 'in-flight child',
          parentSpan: root as Sentry.Span,
        }),
    );
    child.end();

    const standalone = envelopes.find(([, items]) =>
      items.some(([itemHeaders]) => itemHeaders.type === 'span'),
    );
    return (standalone?.[0] as { trace?: Record<string, string> }).trace;
  }

  it('sends the child of a local root with its DSN key in the trace header', () => {
    const header = standaloneChildTraceHeader(false);

    expect(header?.public_key).toBe(PUBLIC_KEY);
  });

  it('sends the child of a continued root with its DSN key in the trace header', () => {
    const header = standaloneChildTraceHeader(true);

    expect(header?.trace_id).toBe(PARENT_TRACE_ID);
    expect(header?.public_key).toBe(PUBLIC_KEY);
  });
});
