import browser from 'webextension-polyfill';
import {
  CRITICAL_ERROR_RESTORE_KEY,
  METAMASK_RESTORING_PAGE_URL,
} from '../../../../shared/constants/critical-error-restore-session';
import { captureException } from '../../../../shared/lib/sentry';
import {
  CriticalErrorRestorePointerKeyPrefix,
  CriticalErrorRestoreSecondaryPointerKeyPrefix,
  CriticalErrorRestoreValueKeyPrefix,
  readCriticalErrorRestoreSession,
  clearCriticalErrorRestoreSession,
  openRestoringTabAndReload,
  handoffRestoringTabToExtension,
  type ExtensionPlatformLike,
} from './critical-error-tab-handoff';

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  },
}));

const pointerKey0 = `${CriticalErrorRestorePointerKeyPrefix}0`;
const pointerKey1 = `${CriticalErrorRestorePointerKeyPrefix}1`;
const pointerKey2 = `${CriticalErrorRestorePointerKeyPrefix}2`;
const pointerKey3 = `${CriticalErrorRestorePointerKeyPrefix}3`;
const secondaryPointerKey0 = `${CriticalErrorRestoreSecondaryPointerKeyPrefix}0`;
const secondaryPointerKey1 = `${CriticalErrorRestoreSecondaryPointerKeyPrefix}1`;
const secondaryPointerKey2 = `${CriticalErrorRestoreSecondaryPointerKeyPrefix}2`;
const secondaryPointerKey3 = `${CriticalErrorRestoreSecondaryPointerKeyPrefix}3`;
const primaryPointerKeys = [pointerKey0, pointerKey1, pointerKey2, pointerKey3];
const secondaryPointerKeys = [
  secondaryPointerKey0,
  secondaryPointerKey1,
  secondaryPointerKey2,
  secondaryPointerKey3,
];
const pointerKeys = [...primaryPointerKeys, ...secondaryPointerKeys];

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function mockStorageGet(
  storage: Record<string, unknown>,
  rejectedKeys: Record<string, Error> = {},
) {
  (browser.storage.local.get as jest.Mock).mockImplementation(async (key) => {
    if (typeof key === 'string') {
      if (rejectedKeys[key]) {
        throw rejectedKeys[key];
      }
      if (hasOwn(storage, key)) {
        return { [key]: storage[key] };
      }
      return {};
    }
    throw new Error('Unexpected storage.local.get arguments');
  });
}

function getGeneratedRestoreWrite(): Record<string, unknown> {
  const generatedWrite = (browser.storage.local.set as jest.Mock).mock.calls
    .map(([value]) => value as Record<string, unknown>)
    .find((value) =>
      Object.keys(value).some((key) =>
        key.startsWith(CriticalErrorRestoreValueKeyPrefix),
      ),
    );
  expect(generatedWrite).toBeDefined();
  return generatedWrite as Record<string, unknown>;
}

function getGeneratedRestoreWriteKey(
  generatedWrite: Record<string, unknown>,
): string {
  const generatedStorageKey = Object.keys(generatedWrite).find((key) =>
    key.startsWith(CriticalErrorRestoreValueKeyPrefix),
  );
  expect(generatedStorageKey).toBeDefined();
  return generatedStorageKey as string;
}

function getStorageValues(
  storage: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  if (hasOwn(storage, key)) {
    return { [key]: storage[key] };
  }
  return {};
}

describe('critical-error-restore session', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockStorageGet({});
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (browser.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
  });

  describe('readCriticalErrorRestoreSession', () => {
    it('returns null when key is not set', async () => {
      mockStorageGet({});

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();
    });

    it('returns null when stored value is not an object', async () => {
      mockStorageGet({
        [CRITICAL_ERROR_RESTORE_KEY]: true,
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();
    });

    it('returns null when tabUrl is missing', async () => {
      mockStorageGet({
        [CRITICAL_ERROR_RESTORE_KEY]: { tabId: 42 },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();
    });

    it('returns payload when restore session data is valid', async () => {
      const tabUrl = 'https://metamask.io/restoring#abc';
      mockStorageGet({
        [CRITICAL_ERROR_RESTORE_KEY]: { tabUrl, tabId: 42 },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toStrictEqual({
        tabId: 42,
        tabUrl,
      });
    });

    it('returns undefined tabId when tabId is not a number', async () => {
      const tabUrl = 'https://metamask.io/restoring#abc';
      mockStorageGet({
        [CRITICAL_ERROR_RESTORE_KEY]: { tabUrl },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toStrictEqual({
        tabId: undefined,
        tabUrl,
      });
    });

    it('returns null when storage.local.get rejects', async () => {
      const storageError = new Error('storage failed');
      mockStorageGet(
        {},
        {
          [CRITICAL_ERROR_RESTORE_KEY]: storageError,
        },
      );

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();

      expect(jest.mocked(captureException)).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'critical-error-restore: failed to read legacy restore session',
          cause: storageError,
        }),
        {
          tags: {
            'persistence.storage_area': 'local',
            'persistence.storage_operation': 'read',
            'persistence.storage_key_class':
              'critical-error-restore-legacy-state',
          },
        },
      );
    });

    it('returns payload from generated storage when a pointer is present', async () => {
      const generatedStorageKey = `${CriticalErrorRestoreValueKeyPrefix}abc`;
      const tabUrl = 'https://metamask.io/restoring#abc';
      mockStorageGet({
        [pointerKey0]: {
          version: 1,
          updatedAt: 1,
          storageKey: generatedStorageKey,
        },
        [generatedStorageKey]: { tabUrl, tabId: 42 },
        [CRITICAL_ERROR_RESTORE_KEY]: { tabUrl: 'legacy' },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toStrictEqual({
        tabId: 42,
        tabUrl,
      });

      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CRITICAL_ERROR_RESTORE_KEY,
      );
    });

    it('returns null when the latest pointer is a tombstone', async () => {
      const generatedStorageKey = `${CriticalErrorRestoreValueKeyPrefix}abc`;
      mockStorageGet({
        [pointerKey0]: {
          version: 1,
          updatedAt: 1,
          storageKey: generatedStorageKey,
        },
        [pointerKey1]: {
          version: 1,
          updatedAt: 2,
          storageKey: null,
        },
        [generatedStorageKey]: {
          tabUrl: 'https://metamask.io/restoring#stale',
        },
        [CRITICAL_ERROR_RESTORE_KEY]: {
          tabUrl: 'https://metamask.io/restoring#legacy',
        },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();

      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CRITICAL_ERROR_RESTORE_KEY,
      );
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        generatedStorageKey,
      );
    });

    it('returns payload from a secondary pointer newer than a primary pointer', async () => {
      const staleStorageKey = `${CriticalErrorRestoreValueKeyPrefix}stale`;
      const generatedStorageKey = `${CriticalErrorRestoreValueKeyPrefix}abc`;
      const tabUrl = 'https://metamask.io/restoring#abc';
      mockStorageGet({
        [pointerKey0]: {
          version: 1,
          updatedAt: 1,
          storageKey: staleStorageKey,
        },
        [secondaryPointerKey0]: {
          version: 1,
          updatedAt: 2,
          storageKey: generatedStorageKey,
        },
        [staleStorageKey]: {
          tabUrl: 'https://metamask.io/restoring#stale',
        },
        [generatedStorageKey]: { tabUrl, tabId: 42 },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toStrictEqual({
        tabId: 42,
        tabUrl,
      });

      expect(browser.storage.local.get).toHaveBeenCalledWith(
        generatedStorageKey,
      );
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        staleStorageKey,
      );
    });

    it('does not fall back to stale legacy restore data when a generated pointer is present but generated storage is missing', async () => {
      const generatedStorageKey = `${CriticalErrorRestoreValueKeyPrefix}abc`;
      mockStorageGet({
        [pointerKey0]: {
          version: 1,
          updatedAt: 1,
          storageKey: generatedStorageKey,
        },
        [CRITICAL_ERROR_RESTORE_KEY]: {
          tabUrl: 'https://metamask.io/restoring#legacy',
        },
      });

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();

      expect(browser.storage.local.get).toHaveBeenCalledWith(
        generatedStorageKey,
      );
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CRITICAL_ERROR_RESTORE_KEY,
      );
    });

    it('does not fall back to stale legacy restore data when generated pointer slots are unreadable', async () => {
      mockStorageGet(
        {
          [CRITICAL_ERROR_RESTORE_KEY]: {
            tabUrl: 'https://metamask.io/restoring#legacy',
          },
        },
        Object.fromEntries(
          pointerKeys.map((pointerKey) => [
            pointerKey,
            new Error(`block checksum mismatch for ${pointerKey}`),
          ]),
        ),
      );

      await expect(
        readCriticalErrorRestoreSession(browser),
      ).resolves.toBeNull();

      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CRITICAL_ERROR_RESTORE_KEY,
      );
    });
  });

  describe('clearCriticalErrorRestoreSession', () => {
    it('writes a restore session tombstone without removing fixed keys', async () => {
      await clearCriticalErrorRestoreSession(browser);

      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining(
          Object.fromEntries(
            pointerKeys.map((pointerKey) => [
              pointerKey,
              expect.objectContaining({ storageKey: null }),
            ]),
          ),
        ),
      );
      expect(browser.storage.local.remove).not.toHaveBeenCalled();
    });

    it('does not read or remove stale generated restore values when clearing', async () => {
      const generatedStorageKey = `${CriticalErrorRestoreValueKeyPrefix}abc`;
      mockStorageGet({
        [pointerKey0]: {
          version: 1,
          updatedAt: 1,
          storageKey: generatedStorageKey,
        },
      });

      await clearCriticalErrorRestoreSession(browser);

      expect(browser.storage.local.get).not.toHaveBeenCalled();
      expect(browser.storage.local.remove).not.toHaveBeenCalled();
    });

    it('resolves and reports to Sentry when storage.local.set rejects', async () => {
      const setError = new Error('storage set failed');
      (browser.storage.local.set as jest.Mock).mockRejectedValue(setError);

      await expect(
        clearCriticalErrorRestoreSession(browser),
      ).resolves.toBeUndefined();

      expect(jest.mocked(captureException)).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'critical-error-restore: failed to write restore session pointers',
          cause: setError,
        }),
        {
          tags: {
            'persistence.storage_area': 'local',
            'persistence.storage_operation': 'write',
            'persistence.storage_key_class': 'critical-error-restore-pointer',
          },
        },
      );
    });
  });
});

describe('openRestoringTabAndReload', () => {
  const requestSafeReload = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.resetAllMocks();
    (browser.tabs.create as jest.Mock).mockResolvedValue({ id: 101 });
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('creates restoring tab, persists restore data, and calls requestSafeReload', async () => {
    await openRestoringTabAndReload(requestSafeReload);

    expect(browser.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        active: true,
        url: expect.stringMatching(/^https:\/\/metamask\.io\/restoring#/u),
      }),
    );

    const generatedWrite = getGeneratedRestoreWrite();
    const generatedStorageKey = getGeneratedRestoreWriteKey(generatedWrite);
    expect(generatedWrite[generatedStorageKey]).toStrictEqual(
      expect.objectContaining({
        tabId: 101,
        tabUrl: expect.stringContaining(METAMASK_RESTORING_PAGE_URL),
      }),
    );
    expect(browser.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [pointerKey0]: expect.objectContaining({
          storageKey: expect.stringMatching(
            `^${CriticalErrorRestoreValueKeyPrefix}`,
          ),
        }),
        [pointerKey1]: expect.objectContaining({
          storageKey: expect.stringMatching(
            `^${CriticalErrorRestoreValueKeyPrefix}`,
          ),
        }),
      }),
    );
    expect(browser.storage.local.remove).not.toHaveBeenCalled();
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('omits tabId when tabs.create fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (browser.tabs.create as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    await openRestoringTabAndReload(requestSafeReload);

    const generatedWrite = getGeneratedRestoreWrite();
    const generatedStorageKey = getGeneratedRestoreWriteKey(generatedWrite);
    const storedValue = generatedWrite[generatedStorageKey];
    expect(storedValue).not.toHaveProperty('tabId');
    expect(storedValue).toHaveProperty('tabUrl');
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it('reports storage.local.set failures and still calls requestSafeReload', async () => {
    const storageError = new Error('storage set failed');
    (browser.storage.local.set as jest.Mock).mockRejectedValueOnce(
      storageError,
    );

    await openRestoringTabAndReload(requestSafeReload);

    expect(jest.mocked(captureException)).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'critical-error-restore: failed to save generated restore session to storage.local',
        cause: storageError,
      }),
      {
        tags: {
          'persistence.storage_area': 'local',
          'persistence.storage_operation': 'write',
          'persistence.storage_key_class':
            'critical-error-restore-generated-state',
        },
      },
    );
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('uses secondary pointers when primary pointer writes fail', async () => {
    (browser.storage.local.set as jest.Mock).mockImplementation(
      async (value: Record<string, unknown>) => {
        if (
          primaryPointerKeys.some((pointerKey) => hasOwn(value, pointerKey))
        ) {
          throw new Error('pointer write failed');
        }
      },
    );

    await openRestoringTabAndReload(requestSafeReload);

    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [secondaryPointerKey0]: expect.objectContaining({
        storageKey: expect.stringMatching(
          `^${CriticalErrorRestoreValueKeyPrefix}`,
        ),
      }),
    });
    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [secondaryPointerKey1]: expect.objectContaining({
        storageKey: expect.stringMatching(
          `^${CriticalErrorRestoreValueKeyPrefix}`,
        ),
      }),
    });
    expect(browser.storage.local.set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        [CRITICAL_ERROR_RESTORE_KEY]: expect.anything(),
      }),
    );
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('serializes restore save and clear so the clear tombstone wins', async () => {
    const storage: Record<string, unknown> = {};
    let inFlightSetCalls = 0;
    let maxInFlightSetCalls = 0;
    let resolveGeneratedWriteStarted: () => void = () => undefined;
    const generatedWriteStarted = new Promise<void>((resolve) => {
      resolveGeneratedWriteStarted = resolve;
    });
    (browser.storage.local.get as jest.Mock).mockImplementation(
      async (key: string) => getStorageValues(storage, key),
    );
    (browser.storage.local.set as jest.Mock).mockImplementation(
      async (value: Record<string, unknown>) => {
        inFlightSetCalls += 1;
        maxInFlightSetCalls = Math.max(maxInFlightSetCalls, inFlightSetCalls);
        if (
          Object.keys(value).some((key) =>
            key.startsWith(CriticalErrorRestoreValueKeyPrefix),
          )
        ) {
          resolveGeneratedWriteStarted();
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        Object.assign(storage, value);
        inFlightSetCalls -= 1;
      },
    );
    (browser.storage.local.remove as jest.Mock).mockImplementation(
      async (keys: string[] | string) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const key of keysToRemove) {
          delete storage[key];
        }
      },
    );

    const savePromise = openRestoringTabAndReload(requestSafeReload);
    await generatedWriteStarted;
    const clearPromise = clearCriticalErrorRestoreSession(browser);

    await Promise.all([savePromise, clearPromise]);

    expect(maxInFlightSetCalls).toBe(1);
    expect(storage[pointerKey0]).toStrictEqual(
      expect.objectContaining({ storageKey: null }),
    );
    expect(
      Object.keys(storage).some((key) =>
        key.startsWith(CriticalErrorRestoreValueKeyPrefix),
      ),
    ).toBe(true);
    await expect(readCriticalErrorRestoreSession(browser)).resolves.toBeNull();
  });
});

describe('handoffRestoringTabToExtension', () => {
  const getExtensionURL = jest
    .fn()
    .mockReturnValue('chrome-extension://abc/home.html');
  const platform: ExtensionPlatformLike = { getExtensionURL };

  beforeEach(() => {
    jest.resetAllMocks();
    getExtensionURL.mockReturnValue('chrome-extension://abc/home.html');
  });

  it('opens extension UI in a new tab when tab id is undefined', async () => {
    (browser.tabs.create as jest.Mock).mockResolvedValueOnce({ id: 1 });

    await handoffRestoringTabToExtension(platform, {
      tabId: undefined,
      tabUrl: 'https://metamask.io/restoring#1',
    });

    expect(browser.tabs.get).not.toHaveBeenCalled();
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/home.html',
      active: true,
    });
  });

  it('updates tab when URL still matches', async () => {
    const tabUrl = 'https://metamask.io/restoring#frag';
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: tabUrl,
    });
    (browser.tabs.update as jest.Mock).mockResolvedValueOnce({});

    await handoffRestoringTabToExtension(platform, { tabId: 7, tabUrl });

    expect(browser.tabs.update).toHaveBeenCalledWith(7, {
      active: true,
      url: 'chrome-extension://abc/home.html',
    });
    expect(browser.tabs.create).not.toHaveBeenCalled();
  });

  it('updates tab when metamask.io redirected to locale-prefixed path', async () => {
    const tabUrl = 'https://metamask.io/restoring#frag';
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: 'https://metamask.io/en-GB/restoring#frag',
    });
    (browser.tabs.update as jest.Mock).mockResolvedValueOnce({});

    await handoffRestoringTabToExtension(platform, { tabId: 7, tabUrl });

    expect(browser.tabs.update).toHaveBeenCalledWith(7, {
      active: true,
      url: 'chrome-extension://abc/home.html',
    });
    expect(browser.tabs.create).not.toHaveBeenCalled();
  });

  it('opens extension UI in a new tab when URL diverged', async () => {
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: 'https://example.com/',
    });

    (browser.tabs.create as jest.Mock).mockResolvedValueOnce({ id: 2 });

    await handoffRestoringTabToExtension(platform, {
      tabId: 7,
      tabUrl: 'https://metamask.io/restoring#frag',
    });

    expect(browser.tabs.update).not.toHaveBeenCalled();
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/home.html',
      active: true,
    });
  });

  it('opens extension UI in a new tab when hash fragment differs', async () => {
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: 'https://metamask.io/restoring#different',
    });

    (browser.tabs.create as jest.Mock).mockResolvedValueOnce({ id: 2 });

    await handoffRestoringTabToExtension(platform, {
      tabId: 7,
      tabUrl: 'https://metamask.io/restoring#frag',
    });

    expect(browser.tabs.update).not.toHaveBeenCalled();
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/home.html',
      active: true,
    });
  });

  it('opens extension UI in a new tab when tab is gone', async () => {
    (browser.tabs.get as jest.Mock).mockRejectedValueOnce(new Error('No tab'));
    (browser.tabs.create as jest.Mock).mockResolvedValueOnce({ id: 2 });

    await expect(
      handoffRestoringTabToExtension(platform, {
        tabId: 99,
        tabUrl: 'https://metamask.io/restoring#frag',
      }),
    ).resolves.toBeUndefined();

    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/home.html',
      active: true,
    });
  });

  it('opens extension UI in a new tab when tabs.update fails', async () => {
    const tabUrl = 'https://metamask.io/restoring#frag';
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: tabUrl,
    });
    (browser.tabs.update as jest.Mock).mockRejectedValueOnce(
      new Error('update failed'),
    );
    (browser.tabs.create as jest.Mock).mockResolvedValueOnce({ id: 2 });

    await handoffRestoringTabToExtension(platform, { tabId: 7, tabUrl });

    expect(browser.tabs.update).toHaveBeenCalledTimes(1);
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/home.html',
      active: true,
    });
  });

  it('opens extension UI in a new tab when restoring tab has no URL', async () => {
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({ id: 7 });
    (browser.tabs.create as jest.Mock).mockResolvedValueOnce({ id: 2 });

    await handoffRestoringTabToExtension(platform, {
      tabId: 7,
      tabUrl: 'https://metamask.io/restoring#frag',
    });

    expect(browser.tabs.update).not.toHaveBeenCalled();
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/home.html',
      active: true,
    });
  });
});
