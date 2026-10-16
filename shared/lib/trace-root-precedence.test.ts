import * as Sentry from '@sentry/browser';
import { trace, TraceName } from './trace';

/**
 * Pins how `root` and `parentContext` combine, with the real SDK. Only
 * `root` alone moves a span to a new trace; an explicit parent that resolves
 * keeps the child on the parent's trace even when `root` is also set.
 */
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
});
