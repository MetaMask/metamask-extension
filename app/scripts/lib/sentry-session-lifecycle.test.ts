import * as Sentry from '@sentry/browser';
import { forEachEnvelopeItem, parseEnvelope } from '@sentry/core';
import { tick } from '../../../test/lib/timer-helpers';
import { makeTransport } from './sentry-make-transport';

type FetchCallArgs = [RequestInfo | URL, RequestInit | undefined];

// Lives in its own file deliberately: `browserSessionIntegration.setupOnce`
// runs once per process, so the init-time session belongs to the first
// `Sentry.init` in the worker. A dedicated file makes this test the first
// (and only) init, letting it observe the organic init-trigger session that
// shared test files cannot.
async function flushMicrotasks(depth = 5): Promise<void> {
  for (let i = 0; i < depth; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  }
}

function emptySentrySnapshot() {
  return { browser: '', version: '', store: {} };
}

function minimalFetchResponse(): Response {
  return new Response('{}', { status: 200 });
}

describe('sentry session lifecycle (organic init trigger)', () => {
  it('sends the session created by browserSessionIntegration at init when opted in', async () => {
    globalThis.history ??= {} as unknown as History;
    globalThis.stateHooks = {
      ...globalThis.stateHooks,
      getSentryState: () => emptySentrySnapshot(),
      getPersistedState: async () => ({
        data: {
          AnalyticsController: {
            analyticsId: 'session-lifecycle-test-id',
            optedIn: true,
          },
          MetaMetricsController: {
            completedMetaMetricsOnboarding: true,
          },
        },
      }),
    };

    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(minimalFetchResponse());

    Sentry.init({
      dsn: 'https://public@fake.ingest.sentry.io/1',
      release: 'setup-sentry-unit-test',
      transport: makeTransport,
      tracesSampleRate: 0,
      // jsdom mocks `chrome.runtime.id`, so the SDK's embedded-extension
      // detection would otherwise disable init in unit tests.
      skipBrowserExtensionCheck: true,
    });
    await flushMicrotasks();
    await tick();

    const fetchCalls = fetchSpy.mock.calls as FetchCallArgs[];
    const sessionSent = fetchCalls
      .map(([, init]) => init?.body)
      .filter((body): body is NonNullable<RequestInit['body']> => Boolean(body))
      .some((body) => {
        try {
          const parsedEnvelope = parseEnvelope(
            body as Parameters<typeof parseEnvelope>[0],
          );
          return forEachEnvelopeItem(
            parsedEnvelope,
            (_item: unknown, type: string) => type === 'session',
          );
        } catch {
          return false;
        }
      });
    expect(sessionSent).toBe(true);

    fetchSpy.mockRestore();
  });
});
