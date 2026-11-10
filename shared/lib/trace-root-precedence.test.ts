import * as Sentry from '@sentry/browser';
import { trace, TraceName } from './trace';

// Real SDK, not mocks: the assertions read Sentry's own trace and parent ids.
describe('trace root and parentContext (real SDK)', () => {
  let parent: Sentry.Span;

  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [],
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  function child(request: { root?: boolean; parentContext?: unknown }) {
    return trace({ name: TraceName.Middleware, ...request }, (span) =>
      Sentry.spanToJSON(span as Sentry.Span),
    );
  }

  function underParent<ResultType>(fn: () => ResultType): ResultType {
    return trace({ name: TraceName.Transaction }, (span) => {
      parent = span as Sentry.Span;
      return fn();
    });
  }

  it('starts a new trace for root alone', () => {
    const json = underParent(() => child({ root: true }));
    expect(json.trace_id).not.toBe(parent.spanContext().traceId);
    expect(json.parent_span_id).toBeUndefined();
  });

  it('keeps an explicit parent when root is also set', () => {
    const json = underParent(() =>
      child({ root: true, parentContext: parent }),
    );
    expect(json.trace_id).toBe(parent.spanContext().traceId);
    expect(json.parent_span_id).toBe(parent.spanContext().spanId);
  });

  it('starts a new trace for root when its parentContext does not resolve', () => {
    const json = underParent(() =>
      // eslint-disable-next-line @typescript-eslint/naming-convention
      child({ root: true, parentContext: { _name: 'Never started' } }),
    );
    expect(json.trace_id).not.toBe(parent.spanContext().traceId);
    expect(json.parent_span_id).toBeUndefined();
  });
});
