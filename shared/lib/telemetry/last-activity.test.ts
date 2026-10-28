const sessionStore: Record<string, unknown> = {};

const mockStorageSessionGet = jest.fn(async (keys: string[]) => {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (sessionStore[key] !== undefined) {
      result[key] = sessionStore[key];
    }
  }
  return result;
});

const mockStorageSessionSet = jest.fn(
  async (values: Record<string, unknown>) => {
    Object.assign(sessionStore, values);
  },
);

jest.mock('webextension-polyfill', () => ({
  storage: {
    session: {
      get: (...args: unknown[]) =>
        mockStorageSessionGet(...(args as [string[]])),
      set: (...args: unknown[]) =>
        mockStorageSessionSet(...(args as [Record<string, unknown>])),
    },
  },
}));

let mockIsManifestV3 = true;

jest.mock('../mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3;
  },
}));

describe('last-activity', () => {
  const previousSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockIsManifestV3 = true;
    for (const key of Object.keys(sessionStore)) {
      delete sessionStore[key];
    }
  });

  afterEach(() => {
    jest.useRealTimers();
    if (previousSelf) {
      Object.defineProperty(globalThis, 'self', previousSelf);
    } else {
      delete (globalThis as { self?: unknown }).self;
    }
  });

  /**
   * Simulates running in a popup/side panel/fullscreen/notification UI
   * context instead of the background, matching how `getEnvironmentType`
   * classifies `self.location.href` in `persistence-manager.test.ts`.
   */
  function mockUiEnvironment() {
    Object.defineProperty(globalThis, 'self', {
      value: { location: { href: 'chrome-extension://abc/popup.html' } },
      configurable: true,
    });
  }

  describe('getLastActivityContext', () => {
    it('omits unset signals before anything is recorded', async () => {
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity } =
        await import('./last-activity');
      await hydrateLastActivity();

      expect(getLastActivityContext(1_500)).toStrictEqual({
        msSinceLastAppStart: 500,
        serviceWorkerReloadCount: 0,
      });
    });

    it('defaults to the current time when no `now` is provided', async () => {
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity } =
        await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(1_300);

      expect(getLastActivityContext().msSinceLastAppStart).toBe(300);
    });

    it('reports the elapsed time since the last write', async () => {
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity, recordWrite } =
        await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(2_000);
      recordWrite();

      expect(getLastActivityContext(2_750).msSinceLastWrite).toBe(750);
    });

    it('reports msSinceLastUiOpen only while a UI is open', async () => {
      jest.setSystemTime(1_000);
      const {
        getLastActivityContext,
        hydrateLastActivity,
        recordUiOpen,
        recordUiClosed,
      } = await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(3_000);
      recordUiOpen();

      expect(getLastActivityContext(3_200)).toStrictEqual(
        expect.objectContaining({
          msSinceLastUiOpen: 200,
        }),
      );
      expect(getLastActivityContext(3_200).msSinceLastUiClosed).toBeUndefined();

      jest.setSystemTime(4_000);
      recordUiClosed();

      expect(getLastActivityContext(4_100).msSinceLastUiOpen).toBeUndefined();
      expect(getLastActivityContext(4_100).msSinceLastUiClosed).toBe(100);
    });

    it('reports the elapsed time since the last window event', async () => {
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity, recordWindowEvent } =
        await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(5_000);
      recordWindowEvent();

      expect(getLastActivityContext(5_050).msSinceLastWindowEvent).toBe(50);
    });

    it('tracks each signal independently while all UIs are closed', async () => {
      jest.setSystemTime(1_000);
      const {
        getLastActivityContext,
        hydrateLastActivity,
        recordWrite,
        recordUiOpen,
        recordUiClosed,
        recordWindowEvent,
      } = await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(2_000);
      recordWrite();
      jest.setSystemTime(3_000);
      recordUiOpen();
      jest.setSystemTime(4_000);
      recordUiClosed();
      jest.setSystemTime(5_000);
      recordWindowEvent();

      expect(getLastActivityContext(6_000)).toStrictEqual({
        msSinceLastAppStart: 5_000,
        msSinceLastWrite: 4_000,
        msSinceLastUiClosed: 2_000,
        msSinceLastWindowEvent: 1_000,
        serviceWorkerReloadCount: 0,
      });
    });

    it('omits msSinceLastServiceWorkerReload when reload count is 0', async () => {
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity } =
        await import('./last-activity');
      await hydrateLastActivity();

      expect(
        getLastActivityContext(1_500).msSinceLastServiceWorkerReload,
      ).toBeUndefined();
      expect(getLastActivityContext(1_500).serviceWorkerReloadCount).toBe(0);
    });

    it('updates msSinceLastWrite on every call to recordWrite', async () => {
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity, recordWrite } =
        await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(2_000);
      recordWrite();
      jest.setSystemTime(2_100);
      recordWrite();

      expect(getLastActivityContext(2_150).msSinceLastWrite).toBe(50);
    });

    it('does not restore session state when manifest v3 session storage is unavailable', async () => {
      mockIsManifestV3 = false;
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity } =
        await import('./last-activity');
      await hydrateLastActivity();

      expect(mockStorageSessionGet).not.toHaveBeenCalled();
      expect(getLastActivityContext(1_200)).toStrictEqual({
        msSinceLastAppStart: 200,
      });
    });

    it('does not read or write session state from a UI context', async () => {
      mockUiEnvironment();
      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity, recordWrite } =
        await import('./last-activity');
      await hydrateLastActivity();

      jest.setSystemTime(2_000);
      recordWrite();
      await Promise.resolve();

      expect(mockStorageSessionGet).not.toHaveBeenCalled();
      expect(mockStorageSessionSet).not.toHaveBeenCalled();
      expect(getLastActivityContext(2_500)).toStrictEqual({
        msSinceLastAppStart: 1_500,
        msSinceLastWrite: 500,
      });
    });
  });

  describe('session persistence', () => {
    it('restores first app start across a service-worker reload', async () => {
      jest.setSystemTime(1_000);
      const first = await import('./last-activity');
      await first.hydrateLastActivity();

      jest.setSystemTime(2_000);
      first.recordWrite();
      jest.setSystemTime(3_000);
      first.recordUiOpen();
      jest.setSystemTime(4_000);
      first.recordUiClosed();
      jest.setSystemTime(5_000);
      first.recordWindowEvent();
      await Promise.resolve();

      jest.resetModules();
      jest.setSystemTime(8_000);
      const second = await import('./last-activity');
      await second.hydrateLastActivity();

      expect(second.getLastActivityContext(8_500)).toStrictEqual({
        msSinceLastAppStart: 7_500,
        msSinceLastWrite: 6_500,
        msSinceLastUiClosed: 4_500,
        msSinceLastWindowEvent: 3_500,
        msSinceLastServiceWorkerReload: 500,
        serviceWorkerReloadCount: 1,
      });
    });

    it('restores UI-open presence across a service-worker reload', async () => {
      jest.setSystemTime(1_000);
      const first = await import('./last-activity');
      await first.hydrateLastActivity();
      jest.setSystemTime(3_000);
      first.recordUiOpen();
      await Promise.resolve();

      jest.resetModules();
      jest.setSystemTime(8_000);
      const second = await import('./last-activity');
      await second.hydrateLastActivity();

      expect(second.getLastActivityContext(8_500)).toStrictEqual({
        msSinceLastAppStart: 7_500,
        msSinceLastUiOpen: 5_500,
        msSinceLastServiceWorkerReload: 500,
        serviceWorkerReloadCount: 1,
      });
      expect(
        second.getLastActivityContext(8_500).msSinceLastUiClosed,
      ).toBeUndefined();
    });

    it('keeps an in-memory timestamp recorded before hydrate finishes', async () => {
      let releaseGet: (() => void) | undefined;
      mockStorageSessionGet.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseGet = () => {
              resolve({
                lastActivity: {
                  appStartedAt: 10,
                  lastWriteAt: 50,
                  serviceWorkerReloadCount: 4,
                },
              });
            };
          }),
      );

      jest.setSystemTime(1_000);
      const { getLastActivityContext, hydrateLastActivity, recordWrite } =
        await import('./last-activity');

      jest.setSystemTime(2_000);
      recordWrite();
      releaseGet?.();
      await hydrateLastActivity();

      expect(getLastActivityContext(2_500)).toStrictEqual({
        msSinceLastAppStart: 2_490,
        msSinceLastWrite: 500,
        msSinceLastServiceWorkerReload: 1_500,
        serviceWorkerReloadCount: 5,
      });
    });

    it('does not inflate serviceWorkerReloadCount when a UI context hydrates between two background reloads', async () => {
      jest.setSystemTime(1_000);
      const first = await import('./last-activity');
      await first.hydrateLastActivity();
      first.recordWrite();
      await Promise.resolve();

      // A popup opens while the background is still alive, and hydrates
      // transitively via `PersistenceManager`. It must not touch session
      // storage.
      jest.resetModules();
      mockUiEnvironment();
      jest.setSystemTime(2_000);
      const ui = await import('./last-activity');
      await ui.hydrateLastActivity();
      await Promise.resolve();

      // The background worker then actually restarts.
      jest.resetModules();
      Object.defineProperty(globalThis, 'self', previousSelf ?? {});
      if (!previousSelf) {
        delete (globalThis as { self?: unknown }).self;
      }
      jest.setSystemTime(3_000);
      const second = await import('./last-activity');
      await second.hydrateLastActivity();

      expect(
        second.getLastActivityContext(3_000).serviceWorkerReloadCount,
      ).toBe(1);
    });
  });
});
