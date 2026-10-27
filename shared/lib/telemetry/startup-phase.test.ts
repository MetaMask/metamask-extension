import { StartupFlavor, StartupPhase } from './startup-phase';

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
  runtime: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- webextension API property
    getManifest: jest.fn(() => ({ manifest_version: 3 })),
  },
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

describe('startup-phase', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockIsManifestV3 = true;
    for (const key of Object.keys(sessionStore)) {
      delete sessionStore[key];
    }
  });

  describe('setStartupPhase', () => {
    it('reports cold phases when startupFlavor is absent', async () => {
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.Initializing);
      expect(getStartupPhase()).toBe('initializing');
      expect(mockStorageSessionGet).toHaveBeenCalledWith(['startupFlavor']);

      await setStartupPhase(StartupPhase.SettingUpController);
      expect(getStartupPhase()).toBe('setting-up-controller');
      expect(mockStorageSessionSet).toHaveBeenCalledWith({
        startupFlavor: StartupFlavor.Warm,
      });
      expect(sessionStore.startupFlavor).toBe(StartupFlavor.Warm);

      await setStartupPhase(StartupPhase.Initialized);
      expect(getStartupPhase()).toBe('initialized');
    });

    it('reports warm phases after a cold init then module remount', async () => {
      const firstLoad = await import('./startup-phase');

      await firstLoad.setStartupPhase(StartupPhase.Initializing);
      await firstLoad.setStartupPhase(StartupPhase.SettingUpController);
      await firstLoad.setStartupPhase(StartupPhase.Initialized);
      expect(sessionStore.startupFlavor).toBe(StartupFlavor.Warm);

      jest.resetModules();
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.Initializing);
      expect(getStartupPhase()).toBe('reinitializing');

      await setStartupPhase(StartupPhase.SettingUpController);
      expect(getStartupPhase()).toBe('resetting-up-controller');

      await setStartupPhase(StartupPhase.Initialized);
      expect(getStartupPhase()).toBe('reinitialized');
    });

    it('skips session reads and writes on MV2 cold start', async () => {
      mockIsManifestV3 = false;
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.Initializing);
      await setStartupPhase(StartupPhase.SettingUpController);

      expect(mockStorageSessionGet).not.toHaveBeenCalled();
      expect(mockStorageSessionSet).not.toHaveBeenCalled();
      expect(getStartupPhase()).toBe('setting-up-controller');
    });

    it('reports distinct repairing then repair-initializing', async () => {
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.Initializing);
      await setStartupPhase(StartupPhase.SettingUpController);
      await setStartupPhase(StartupPhase.Initialized);
      expect(sessionStore.startupFlavor).toBe(StartupFlavor.Warm);

      await setStartupPhase(StartupPhase.Repairing);
      expect(getStartupPhase()).toBe('repairing');
      expect(sessionStore.startupFlavor).toBe(StartupFlavor.Repair);

      await setStartupPhase(StartupPhase.Resetting);
      expect(getStartupPhase()).toBe('repair-resetting');

      await setStartupPhase(StartupPhase.Initializing);
      expect(getStartupPhase()).toBe('repair-initializing');

      await setStartupPhase(StartupPhase.SettingUpController);
      expect(getStartupPhase()).toBe('repair-setting-up-controller');
      expect(sessionStore.startupFlavor).toBe(StartupFlavor.Warm);

      await setStartupPhase(StartupPhase.Initialized);
      expect(getStartupPhase()).toBe('repair-initialized');
    });

    it('reports repair- on MV2 after Repairing', async () => {
      mockIsManifestV3 = false;
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.Repairing);
      expect(getStartupPhase()).toBe('repairing');

      await setStartupPhase(StartupPhase.Initializing);
      expect(getStartupPhase()).toBe('repair-initializing');
    });

    it('reports shutting-down without flavor mapping', async () => {
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.ShuttingDown);
      expect(getStartupPhase()).toBe('shutting-down');
    });

    it('keeps in-memory phase when session write rejects', async () => {
      mockStorageSessionSet.mockRejectedValueOnce(new Error('quota exceeded'));
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await expect(
        setStartupPhase(StartupPhase.Repairing),
      ).resolves.toBeUndefined();
      expect(getStartupPhase()).toBe('repairing');

      await expect(
        setStartupPhase(StartupPhase.SettingUpController),
      ).resolves.toBeUndefined();
      expect(getStartupPhase()).toBe('repair-setting-up-controller');
    });

    it('falls back to cold when session read rejects', async () => {
      mockStorageSessionGet.mockRejectedValueOnce(
        new Error('session unavailable'),
      );
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await expect(
        setStartupPhase(StartupPhase.Initializing),
      ).resolves.toBeUndefined();
      expect(getStartupPhase()).toBe('initializing');
    });

    it('treats leftover session repair on a fresh SW as warm', async () => {
      sessionStore.startupFlavor = StartupFlavor.Repair;
      const { getStartupPhase, setStartupPhase } =
        await import('./startup-phase');

      await setStartupPhase(StartupPhase.Initializing);
      expect(getStartupPhase()).toBe('reinitializing');

      await setStartupPhase(StartupPhase.SettingUpController);
      expect(getStartupPhase()).toBe('resetting-up-controller');
      expect(sessionStore.startupFlavor).toBe(StartupFlavor.Warm);
    });
  });
});
