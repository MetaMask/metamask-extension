import type { PersistenceManager as PersistenceManagerType } from '../../../shared/lib/stores/persistence-manager';

const mockGet = jest.fn();
const mockGetBackup = jest.fn();
const mockCleanUpMostRecentRetrievedState = jest.fn();
const mockPersistenceOn = jest.fn();
let mockMostRecentRetrievedState: unknown = null;

jest.mock('../platforms/extension', () => {
  return jest.fn().mockImplementation(() => ({
    getVersion: () => '1.0.0',
  }));
});

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({ testing: {} }),
}));

jest.mock('../constants/sentry-state', () => ({
  SENTRY_BACKGROUND_STATE: {},
}));

jest.mock('../../../shared/lib/object.utils', () => ({
  maskObject: jest.fn((obj) => obj),
}));

jest.mock('../../../shared/lib/stores/extension-store', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('../../../shared/lib/stores/fixture-extension-store', () => ({
  FixtureExtensionStore: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../shared/lib/stores/persistence-manager', () => ({
  PersistenceManager: jest.fn().mockImplementation(() => {
    const instance = {
      get: mockGet,
      getBackup: mockGetBackup,
      cleanUpMostRecentRetrievedState: mockCleanUpMostRecentRetrievedState,
      on: (...args: unknown[]) => {
        mockPersistenceOn(...args);
        return instance;
      },
      off: jest.fn(),
      get mostRecentRetrievedState() {
        return mockMostRecentRetrievedState;
      },
    };
    return instance;
  }),
}));

/**
 * Re-imports the module with a fresh module registry so top-level code
 * re-runs with the current `globalThis.self.location.href`.
 */
async function importFresh(): Promise<{
  persistenceManager: PersistenceManagerType;
}> {
  // eslint-disable-next-line import-x/extensions -- jest.resetModules requires extension for re-import
  const mod = await import('./setup-initial-state-hooks.js');
  return mod as unknown as { persistenceManager: PersistenceManagerType };
}

function setSelfHref(href: string): void {
  Object.defineProperty(globalThis, 'self', {
    value: { location: { href } },
    writable: true,
    configurable: true,
  });
}

describe('setup-initial-state-hooks', () => {
  const originalSelf = globalThis.self;

  beforeEach(() => {
    jest.resetModules();
    mockMostRecentRetrievedState = null;
    mockCleanUpMostRecentRetrievedState.mockClear();
    mockPersistenceOn.mockClear();
    globalThis.stateHooks = {} as typeof stateHooks;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'self', {
      value: originalSelf,
      writable: true,
      configurable: true,
    });
  });

  describe('isBackgroundContext (via module behavior)', () => {
    it('detects browserify MV3 background (app-init.js)', async () => {
      setSelfHref('chrome-extension://abc123/scripts/app-init.js');
      const { FixtureExtensionStore } = jest.requireMock(
        '../../../shared/lib/stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: true,
      });
    });

    it('detects webpack MV3 background (service-worker.js)', async () => {
      setSelfHref('chrome-extension://abc123/service-worker.js');
      const { FixtureExtensionStore } = jest.requireMock(
        '../../../shared/lib/stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: true,
      });
    });

    it('detects Firefox MV2 background (background.html)', async () => {
      setSelfHref('moz-extension://abc123/background.html');
      const { FixtureExtensionStore } = jest.requireMock(
        '../../../shared/lib/stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: true,
      });
    });

    it('returns false for UI context (home.html)', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      const { FixtureExtensionStore } = jest.requireMock(
        '../../../shared/lib/stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: false,
      });
    });

    it('returns false for popup UI (popup.html)', async () => {
      setSelfHref('chrome-extension://abc123/popup.html');
      const { FixtureExtensionStore } = jest.requireMock(
        '../../../shared/lib/stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: false,
      });
    });

    it('throws when href is empty (unexpected context)', async () => {
      setSelfHref('');

      await expect(importFresh()).rejects.toThrow(
        'globalThis.self?.location?.href is not defined',
      );
    });

    it('throws when self is undefined (unexpected context)', async () => {
      Object.defineProperty(globalThis, 'self', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(importFresh()).rejects.toThrow(
        'globalThis.self?.location?.href is not defined',
      );
    });
  });

  describe('persistenceManager export', () => {
    it('exports a PersistenceManager instance', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      const { persistenceManager } = await importFresh();

      expect(persistenceManager).toBeDefined();
      expect(persistenceManager.get).toBeDefined();
    });

    it('registers persistence lifecycle event listeners for analytics wiring', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      expect(mockPersistenceOn).toHaveBeenCalledTimes(3);
      expect(mockPersistenceOn).toHaveBeenCalledWith(
        'vaultCorruptionDetected',
        expect.any(Function),
      );
      expect(mockPersistenceOn).toHaveBeenCalledWith(
        'splitStateMigrationSucceeded',
        expect.any(Function),
      );
      expect(mockPersistenceOn).toHaveBeenCalledWith(
        'splitStateMigrationFailed',
        expect.any(Function),
      );
    });
  });

  describe('stateHooks', () => {
    it('registers getPersistedState on globalThis.stateHooks', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      expect(globalThis.stateHooks.getPersistedState).toBeDefined();
      expect(typeof globalThis.stateHooks.getPersistedState).toBe('function');
    });

    it('getPersistedState calls persistenceManager.get', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      await globalThis.stateHooks.getPersistedState();

      expect(mockGet).toHaveBeenCalledWith({ validateVault: false });
    });

    it('registers getBackupState on globalThis.stateHooks', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      const hooks = globalThis.stateHooks as Record<string, unknown>;
      expect(hooks.getBackupState).toBeDefined();
      expect(typeof hooks.getBackupState).toBe('function');
    });

    it('getBackupState calls persistenceManager.getBackup', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      const hooks = globalThis.stateHooks as Record<string, unknown>;
      await (hooks.getBackupState as () => Promise<unknown>)();

      expect(mockGetBackup).toHaveBeenCalled();
    });

    it('registers getSentryState on globalThis.stateHooks', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      expect(globalThis.stateHooks.getSentryState).toBeDefined();
      expect(typeof globalThis.stateHooks.getSentryState).toBe('function');
    });

    describe('getSentryState', () => {
      it('returns app state when getSentryAppState is set', async () => {
        setSelfHref('chrome-extension://abc123/home.html');
        await importFresh();

        const mockAppState = { foo: 'bar' };
        globalThis.stateHooks.getSentryAppState = () => mockAppState;

        const result = globalThis.stateHooks.getSentryState();

        expect(mockCleanUpMostRecentRetrievedState).toHaveBeenCalled();
        expect(result).toStrictEqual(
          expect.objectContaining({
            version: '1.0.0',
            state: mockAppState,
          }),
        );
      });

      it('returns persisted state from mostRecentRetrievedState', async () => {
        setSelfHref('chrome-extension://abc123/home.html');
        await importFresh();

        const mockPersistedState = { data: { config: {} }, meta: {} };
        mockMostRecentRetrievedState = mockPersistedState;

        const result = globalThis.stateHooks.getSentryState();

        expect(result).toStrictEqual(
          expect.objectContaining({
            version: '1.0.0',
            persistedState: mockPersistedState,
          }),
        );
      });

      it('returns persisted state from getMostRecentPersistedState', async () => {
        setSelfHref('chrome-extension://abc123/home.html');
        await importFresh();

        const mockPersistedState = { data: { config: {} }, meta: {} };
        globalThis.stateHooks.getMostRecentPersistedState = () =>
          mockPersistedState;

        const result = globalThis.stateHooks.getSentryState();

        expect(result).toStrictEqual(
          expect.objectContaining({
            version: '1.0.0',
            persistedState: mockPersistedState,
          }),
        );
      });

      it('returns base state when getMostRecentPersistedState returns null', async () => {
        setSelfHref('chrome-extension://abc123/home.html');
        await importFresh();

        globalThis.stateHooks.getMostRecentPersistedState = () => null;

        const result = globalThis.stateHooks.getSentryState();

        expect(result).toStrictEqual(
          expect.objectContaining({ version: '1.0.0' }),
        );
        expect(result).not.toHaveProperty('state');
        expect(result).not.toHaveProperty('persistedState');
      });

      it('returns base state when no app state or persisted state is available', async () => {
        setSelfHref('chrome-extension://abc123/home.html');
        await importFresh();

        const result = globalThis.stateHooks.getSentryState();

        expect(result).toStrictEqual(
          expect.objectContaining({ version: '1.0.0' }),
        );
        expect(result).not.toHaveProperty('state');
        expect(result).not.toHaveProperty('persistedState');
      });
    });
  });
});
