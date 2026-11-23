import * as Sentry from '@sentry/browser';

const globals = globalThis as Record<string, unknown>;

// A real client with no pageload running and every trace sampled.
// Returns the trace id the scope holds outside any operation.
export function startServiceWorkerSentry(): string {
  const perf = globalThis.performance as unknown as Record<string, unknown>;
  perf.getEntriesByType ??= () => [];
  perf.getEntries ??= () => [];
  globals.sentry = Sentry;
  globals.ServiceWorkerGlobalScope = class {
    static [Symbol.hasInstance](instance: unknown) {
      return instance === globalThis;
    }
  };

  const client = new Sentry.BrowserClient({
    dsn: 'https://public@example.ingest.sentry.io/1',
    transport: () => ({
      send: () => Promise.resolve({}),
      flush: () => Promise.resolve(true),
    }),
    stackParser: Sentry.defaultStackParser,
    tracesSampleRate: 1,
    integrations: [
      Sentry.browserTracingIntegration({ instrumentPageLoad: false }),
    ],
  });
  Sentry.getCurrentScope().setClient(client);
  client.init();
  return Sentry.getCurrentScope().getPropagationContext().traceId;
}

export function stopServiceWorkerSentry(): void {
  Sentry.getCurrentScope().setClient(undefined);
  delete globals.ServiceWorkerGlobalScope;
  delete globals.sentry;
}

/**
 * The span a request starting now would see.
 *
 * @returns The active span's trace id and its root span's name, if any.
 */
export function readActiveSpan():
  | { traceId: string; rootName: string | undefined }
  | undefined {
  const span = Sentry.getActiveSpan();
  if (!span) {
    return undefined;
  }
  return {
    traceId: span.spanContext().traceId,
    rootName: Sentry.spanToJSON(Sentry.getRootSpan(span)).description,
  };
}
