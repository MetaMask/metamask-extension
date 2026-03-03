import type { PersistenceManager as PersistenceManagerType } from './stores/persistence-manager';

const mockGet = jest.fn();
const mockGetBackup = jest.fn();
const mockCleanUpMostRecentRetrievedState = jest.fn();

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

jest.mock('../../../shared/modules/object.utils', () => ({
  maskObject: jest.fn((obj) => obj),
}));

jest.mock('./stores/extension-store', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('./stores/fixture-extension-store', () => ({
  FixtureExtensionStore: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./stores/persistence-manager', () => ({
  PersistenceManager: jest.fn().mockImplementation(() => ({
    get: mockGet,
    getBackup: mockGetBackup,
    cleanUpMostRecentRetrievedState: mockCleanUpMostRecentRetrievedState,
    mostRecentRetrievedState: null,
  })),
}));

/**
 * Re-imports the module with a fresh module registry so top-level code
 * re-runs with the current `globalThis.self.location.href`.
 */
async function importFresh(): Promise<{
  persistenceManager: PersistenceManagerType;
}> {
  const mod = await import('./setup-initial-state-hooks');
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
      setSelfHref(
        'chrome-extension://abc123/scripts/app-init.js',
      );
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: true,
      });
    });

    it('detects webpack MV3 background (service-worker.js)', async () => {
      setSelfHref(
        'chrome-extension://abc123/service-worker.js',
      );
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: true,
      });
    });

    it('detects Firefox MV2 background (background.html)', async () => {
      setSelfHref(
        'moz-extension://abc123/background.html',
      );
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: true,
      });
    });

    it('returns false for UI context (home.html)', async () => {
      setSelfHref(
        'chrome-extension://abc123/home.html',
      );
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: false,
      });
    });

    it('returns false for popup UI (popup.html)', async () => {
      setSelfHref(
        'chrome-extension://abc123/popup.html',
      );
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: false,
      });
    });

    it('returns false when href is empty', async () => {
      setSelfHref('');
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: false,
      });
    });

    it('returns false when self is undefined', async () => {
      Object.defineProperty(globalThis, 'self', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const { FixtureExtensionStore } = jest.requireMock(
        './stores/fixture-extension-store',
      );

      await importFresh();

      expect(FixtureExtensionStore).toHaveBeenCalledWith({
        initialize: false,
      });
    });
  });

  describe('persistenceManager export', () => {
    it('exports a PersistenceManager instance', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      const { persistenceManager } = await importFresh();

      expect(persistenceManager).toBeDefined();
      expect(persistenceManager.get).toBeDefined();
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

      expect(globalThis.stateHooks.getBackupState).toBeDefined();
      expect(typeof globalThis.stateHooks.getBackupState).toBe('function');
    });

    it('getBackupState calls persistenceManager.getBackup', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      await globalThis.stateHooks.getBackupState();

      expect(mockGetBackup).toHaveBeenCalled();
    });

    it('registers getSentryState on globalThis.stateHooks', async () => {
      setSelfHref('chrome-extension://abc123/home.html');
      await importFresh();

      expect(globalThis.stateHooks.getSentryState).toBeDefined();
      expect(typeof globalThis.stateHooks.getSentryState).toBe('function');
    });
  });
});
