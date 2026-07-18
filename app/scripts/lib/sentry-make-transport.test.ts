import * as Sentry from '@sentry/browser';
import { forEachEnvelopeItem, parseEnvelope } from '@sentry/core';
import { tick } from '../../../test/lib/timer-helpers';
import { makeTransport } from './sentry-make-transport';

const originalMakeFetchTransport = Sentry.makeFetchTransport.bind(Sentry);

// The v10 session envelope is emitted through a promise chain during init
// (`browserSessionIntegration` -> `captureSession` -> transport), so it is
// observable after a microtask drain with no timers involved.
async function flushMicrotasks(depth = 5): Promise<void> {
  for (let i = 0; i < depth; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  }
}

type TestTransport = ReturnType<typeof makeTransport>;
type TestEnvelope = Parameters<TestTransport['send']>[0];
type ParsedSentryEnvelope = ReturnType<typeof parseEnvelope>;
type FetchCallArgs = [RequestInfo | URL, RequestInit | undefined];

/** Matches `StateHooks.getSentryState` so tests satisfy `types/global.d.ts`. */
function emptySentrySnapshot(): ReturnType<
  (typeof globalThis.stateHooks)['getSentryState']
> {
  return { browser: 'jest', version: '0' };
}

function deleteStateHookProperty(
  key: keyof typeof globalThis.stateHooks,
): void {
  Reflect.deleteProperty(
    globalThis.stateHooks as unknown as Record<string, unknown>,
    key,
  );
}

function minimalFetchResponse(): Response {
  return {
    ok: true,
    headers: { get: () => null },
  } as unknown as Response;
}

function createTestTransportOptions() {
  return {
    url: 'https://public@fake.ingest.sentry.io/api/1/envelope/',
    headers: {},
    recordDroppedEvent: jest.fn(),
  };
}

describe('sentry-make-transport', () => {
  describe('makeTransport (construction)', () => {
    it('does not call fetch when makeTransport is called', () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(minimalFetchResponse());

      makeTransport({} as Parameters<typeof Sentry.makeFetchTransport>[0]);

      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('does not call send or flush on the default transport when makeTransport is called', () => {
      const defaultTransportSend = jest.fn().mockResolvedValue({});
      const defaultTransportFlush = jest.fn().mockResolvedValue(true);
      const makeFetchTransportSpy = jest
        .spyOn(Sentry, 'makeFetchTransport')
        .mockReturnValue({
          send: defaultTransportSend,
          flush: defaultTransportFlush,
        });

      makeTransport({} as Parameters<typeof Sentry.makeFetchTransport>[0]);

      expect(defaultTransportSend).not.toHaveBeenCalled();
      expect(defaultTransportFlush).not.toHaveBeenCalled();

      makeFetchTransportSpy.mockRestore();
    });
  });

  describe('makeTransport', () => {
    let makeFetchTransportSpy: jest.SpyInstance;

    function mockFetchForTransport() {
      return jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(minimalFetchResponse());
    }

    beforeEach(() => {
      makeFetchTransportSpy = jest
        .spyOn(Sentry, 'makeFetchTransport')
        .mockImplementation((options, customFetch) =>
          originalMakeFetchTransport(
            options as Parameters<typeof originalMakeFetchTransport>[0],
            customFetch,
          ),
        );
    });

    afterEach(() => {
      makeFetchTransportSpy.mockRestore();
      deleteStateHookProperty('getPersistedState');
      deleteStateHookProperty('getBackupState');
    });

    it('throws when MetaMetrics is not opted in', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({
          data: {
            AnalyticsController: {
              analyticsId: 'transport-test-id',
              optedIn: false,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [
        {},
        [[{ type: 'event' }, { message: 'test' }]],
      ] as unknown as TestEnvelope;

      await expect(transport.send(envelope)).rejects.toThrow(
        'Network request skipped as metrics disabled',
      );
      // The opted-out path can short-circuit before the fetch transport is
      // instantiated; what matters is the absence of any outbound request.
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('calls fetch when opted in', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({
          data: {
            AnalyticsController: {
              analyticsId: 'transport-test-id',
              optedIn: true,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [
        {},
        [[{ type: 'event' }, { message: 'test event' }]],
      ] as unknown as TestEnvelope;

      await transport.send(envelope);

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('uses app state from getSentryState when available', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({
          ...emptySentrySnapshot(),
          state: {
            AnalyticsController: {
              analyticsId: 'app-state-id',
              optedIn: true,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getPersistedState: async () => ({}),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [
        {},
        [[{ type: 'event' }, { message: 'test' }]],
      ] as unknown as TestEnvelope;

      await transport.send(envelope);

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('falls back to backup state when getPersistedState throws', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({
          AnalyticsController: {
            analyticsId: 'backup-id',
            optedIn: true,
          },
          MetaMetricsController: {
            completedMetaMetricsOnboarding: true,
          },
        }),
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [
        {},
        [[{ type: 'event' }, { message: 'test' }]],
      ] as unknown as TestEnvelope;

      await transport.send(envelope);

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('throws when both getPersistedState and getBackupState fail', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted failed');
        },
        getBackupState: async () => {
          throw new Error('backup failed');
        },
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [
        {},
        [[{ type: 'event' }, { message: 'test' }]],
      ] as unknown as TestEnvelope;

      await expect(transport.send(envelope)).rejects.toThrow(
        'Network request skipped as metrics disabled',
      );
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('Sentry.init with makeTransport (MetaMetrics)', () => {
    afterEach(async () => {
      await Sentry.close(2000);
      deleteStateHookProperty('getPersistedState');
      deleteStateHookProperty('getBackupState');
      deleteStateHookProperty('getSentryState');
    });

    it('does not call fetch after init when opted out', async () => {
      globalThis.history ??= {} as unknown as History;

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({
          data: {
            AnalyticsController: {
              analyticsId: 'init-session-test-id',
              optedIn: false,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(minimalFetchResponse());

      await Sentry.close(2000);
      Sentry.init({
        dsn: 'https://public@fake.ingest.sentry.io/1',
        release: 'setup-sentry-unit-test',
        transport: makeTransport,
        tracesSampleRate: 0,
        // jsdom mocks `chrome.runtime.id`, so the SDK's embedded-extension
        // detection would otherwise disable init in unit tests.
        skipBrowserExtensionCheck: true,
      });
      // Force the session path explicitly (v10 sends sessions on lifecycle
      // triggers, not eagerly at init): even a forced session capture must
      // produce zero outbound requests while opted out.
      Sentry.startSession();
      Sentry.captureSession();
      await flushMicrotasks();
      await tick();

      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('calls fetch after init when opted in', async () => {
      globalThis.history ??= {} as unknown as History;

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({
          data: {
            AnalyticsController: {
              analyticsId: 'init-session-test-id',
              optedIn: true,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(minimalFetchResponse());

      await Sentry.close(2000);
      Sentry.init({
        dsn: 'https://public@fake.ingest.sentry.io/1',
        release: 'setup-sentry-unit-test',
        transport: makeTransport,
        tracesSampleRate: 0,
        // jsdom mocks `chrome.runtime.id`, so the SDK's embedded-extension
        // detection would otherwise disable init in unit tests.
        skipBrowserExtensionCheck: true,
      });
      // Force the session path explicitly (v10 sends sessions on lifecycle
      // triggers, not eagerly at init) and assert it reaches the transport.
      Sentry.startSession();
      Sentry.captureSession();
      await flushMicrotasks();
      await tick();

      expect(fetchSpy).toHaveBeenCalled();

      const fetchCalls = fetchSpy.mock.calls as FetchCallArgs[];

      const envelopes = fetchCalls
        .map(([, init]) => init?.body)
        .filter((body): body is NonNullable<RequestInit['body']> =>
          Boolean(body),
        )
        .map((body): ParsedSentryEnvelope | null => {
          try {
            return parseEnvelope(body as Parameters<typeof parseEnvelope>[0]);
          } catch {
            return null;
          }
        })
        .filter((parsed): parsed is ParsedSentryEnvelope => parsed !== null);

      const hasEventItem = envelopes.some((parsedEnvelope) =>
        forEachEnvelopeItem(
          parsedEnvelope,
          (_item: unknown, type: string) => type === 'session',
        ),
      );
      expect(hasEventItem).toBe(true);

      fetchSpy.mockRestore();
    });
  });
});
