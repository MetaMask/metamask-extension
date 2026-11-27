import * as Sentry from '@sentry/browser';
import { nameRouteSpanAfterDocument } from './setupSentry';

// Real SDK: `browserTracingIntegration` names a navigation from the
// `pushState` URL, which a hash router passes as `#/route`.
describe('nameRouteSpanAfterDocument', () => {
  const navigationNames: string[] = [];

  function startClient(beforeStartSpan?: typeof nameRouteSpanAfterDocument) {
    navigationNames.length = 0;
    (globalThis as typeof globalThis & { nw?: object }).nw = {};
    performance.getEntriesByType ??= () => [];
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({ send: async () => ({}), flush: async () => true }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [
        Sentry.browserTracingIntegration({
          instrumentPageLoad: false,
          ...(beforeStartSpan && { beforeStartSpan }),
        }),
      ],
    });
    Sentry.getCurrentScope().setClient(client);
    client.on('spanStart', (span) => {
      const { op, description } = Sentry.spanToJSON(span);
      if (op === 'navigation') {
        navigationNames.push(description ?? '');
      }
    });
    client.init();
    return client;
  }

  beforeEach(() => {
    window.history.replaceState({}, '', '/home.html');
  });

  afterEach(async () => {
    await Sentry.getClient()?.close();
  });

  it('names a hash-route navigation after the document path', () => {
    startClient(nameRouteSpanAfterDocument);

    window.history.pushState({}, '', '#/unlock');

    expect(navigationNames).toStrictEqual(['/home.html']);
  });

  it('control: without it, the SDK names the navigation `/`', () => {
    startClient();

    window.history.pushState({}, '', '#/settings');

    expect(navigationNames).toStrictEqual(['/']);
  });
});
