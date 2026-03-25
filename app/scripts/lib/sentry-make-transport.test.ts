import * as Sentry from '@sentry/browser';
import { forEachEnvelopeItem, parseEnvelope } from '@sentry/utils';
import { makeTransport } from './sentry-make-transport';

const originalMakeFetchTransport = Sentry.makeFetchTransport.bind(Sentry);

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
        .mockResolvedValue({ ok: true });

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
      return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => null },
      } as Response);
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
      delete globalThis.stateHooks?.getPersistedState;
      delete globalThis.stateHooks?.getBackupState;
    });

    it('throws when MetaMetrics is not opted in', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
        getBackupState: async () => ({}),
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [{}, [[{ type: 'event' }, { message: 'test' }]]];

      await expect(transport.send(envelope)).rejects.toThrow(
        'Network request skipped as metrics disabled',
      );
      expect(makeFetchTransportSpy).toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('calls fetch when opted in', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'transport-test-id',
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
      const envelope = [{}, [[{ type: 'event' }, { message: 'test event' }]]];

      await transport.send(envelope);

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('uses app state from getSentryState when available', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'app-state-id',
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
      const envelope = [{}, [[{ type: 'event' }, { message: 'test' }]]];

      await transport.send(envelope);

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('falls back to backup state when getPersistedState throws', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({}),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({
          MetaMetricsController: {
            participateInMetaMetrics: true,
            metaMetricsId: 'backup-id',
          },
        }),
      };

      const transport = makeTransport(
        createTestTransportOptions() as Parameters<
          typeof Sentry.makeFetchTransport
        >[0],
      );
      const envelope = [{}, [[{ type: 'event' }, { message: 'test' }]]];

      await transport.send(envelope);

      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('throws when both getPersistedState and getBackupState fail', async () => {
      const fetchSpy = mockFetchForTransport();

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({}),
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
      const envelope = [{}, [[{ type: 'event' }, { message: 'test' }]]];

      await expect(transport.send(envelope)).rejects.toThrow(
        'Network request skipped as metrics disabled',
      );
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('Sentry.init with makeTransport (MetaMetrics)', () => {
    function triggerSessionEvent() {
      return new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    afterEach(async () => {
      await Sentry.close(2000);
      delete globalThis.stateHooks?.getPersistedState;
      delete globalThis.stateHooks?.getBackupState;
      delete globalThis.stateHooks?.getSentryState;
    });

    it('does not call fetch after init when opted out (after triggerSessionEvent)', async () => {
      globalThis.nw = {};
      globalThis.history ??= {};

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
        getBackupState: async () => ({}),
      };

      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true });

      await Sentry.close(2000);
      Sentry.init({
        dsn: 'https://public@fake.ingest.sentry.io/1',
        release: 'setup-sentry-unit-test',
        transport: makeTransport,
        tracesSampleRate: 0,
      });

      await triggerSessionEvent();

      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('calls fetch after init when opted in (after triggerSessionEvent)', async () => {
      globalThis.nw = {};
      globalThis.history ??= {};

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => ({}),
        getPersistedState: async () => ({
          data: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'init-session-test-id',
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true });

      await Sentry.close(2000);
      Sentry.init({
        dsn: 'https://public@fake.ingest.sentry.io/1',
        release: 'setup-sentry-unit-test',
        transport: makeTransport,
        tracesSampleRate: 0,
      });

      await triggerSessionEvent();

      expect(fetchSpy).toHaveBeenCalled();

      const envelopes = fetchSpy.mock.calls
        .map(([, init]) => init?.body)
        .filter(Boolean)
        .map((body) => {
          try {
            return parseEnvelope(body);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const hasSessionItem = envelopes.some((envelope) =>
        forEachEnvelopeItem(envelope, (_item, type) => type === 'session'),
      );
      expect(hasSessionItem).toBe(true);

      fetchSpy.mockRestore();
    });
  });
});
