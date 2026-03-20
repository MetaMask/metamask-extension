import browser from 'webextension-polyfill';
import {
  CRITICAL_ERROR_RESTORE_PENDING,
  CRITICAL_ERROR_RESTORE_TAB_ID,
  CRITICAL_ERROR_RESTORE_TAB_URL,
  METAMASK_RESTORING_PAGE_URL,
} from '../../../shared/constants/critical-error-restore-session';
import {
  readPendingCriticalErrorRestore,
  clearPendingCriticalErrorRestore,
  openRestoringTabAndReload,
  handoffRestoringTabToExtension,
  type ExtensionPlatformLike,
} from './critical-error-restore';

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

describe('critical-error-restore session', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('readPendingCriticalErrorRestore', () => {
    it('returns null when pending flag is not set', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({});

      await expect(
        readPendingCriticalErrorRestore(browser),
      ).resolves.toBeNull();
    });

    it('returns null when tab URL is missing', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        [CRITICAL_ERROR_RESTORE_PENDING]: true,
      });

      await expect(
        readPendingCriticalErrorRestore(browser),
      ).resolves.toBeNull();
    });

    it('returns payload when pending restore data is valid', async () => {
      const tabUrl = 'https://metamask.io/restoring#abc';
      (browser.storage.local.get as jest.Mock).mockResolvedValueOnce({
        [CRITICAL_ERROR_RESTORE_PENDING]: true,
        [CRITICAL_ERROR_RESTORE_TAB_URL]: tabUrl,
        [CRITICAL_ERROR_RESTORE_TAB_ID]: 42,
      });

      await expect(
        readPendingCriticalErrorRestore(browser),
      ).resolves.toStrictEqual({
        tabId: 42,
        tabUrl,
      });
    });
  });

  describe('clearPendingCriticalErrorRestore', () => {
    it('removes pending restore keys', async () => {
      (browser.storage.local.remove as jest.Mock).mockResolvedValueOnce(
        undefined,
      );

      await clearPendingCriticalErrorRestore(browser);

      expect(browser.storage.local.remove).toHaveBeenCalledWith([
        CRITICAL_ERROR_RESTORE_PENDING,
        CRITICAL_ERROR_RESTORE_TAB_ID,
        CRITICAL_ERROR_RESTORE_TAB_URL,
      ]);
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

    expect(browser.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [CRITICAL_ERROR_RESTORE_PENDING]: true,
        [CRITICAL_ERROR_RESTORE_TAB_ID]: 101,
        [CRITICAL_ERROR_RESTORE_TAB_URL]: expect.stringContaining(
          METAMASK_RESTORING_PAGE_URL,
        ),
      }),
    );
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('omits tab id when tabs.create fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (browser.tabs.create as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    await openRestoringTabAndReload(requestSafeReload);

    expect(browser.storage.local.set).toHaveBeenCalledWith(
      expect.not.objectContaining({
        [CRITICAL_ERROR_RESTORE_TAB_ID]: expect.anything(),
      }),
    );
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
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

  it('does nothing when tab id is undefined', async () => {
    await handoffRestoringTabToExtension(platform, {
      tabId: undefined,
      tabUrl: 'https://metamask.io/restoring#1',
    });

    expect(browser.tabs.get).not.toHaveBeenCalled();
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
  });

  it('does not update when URL diverged', async () => {
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: 'https://example.com/',
    });

    await handoffRestoringTabToExtension(platform, {
      tabId: 7,
      tabUrl: 'https://metamask.io/restoring#frag',
    });

    expect(browser.tabs.update).not.toHaveBeenCalled();
  });

  it('does not update when hash fragment differs', async () => {
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: 7,
      url: 'https://metamask.io/restoring#different',
    });

    await handoffRestoringTabToExtension(platform, {
      tabId: 7,
      tabUrl: 'https://metamask.io/restoring#frag',
    });

    expect(browser.tabs.update).not.toHaveBeenCalled();
  });

  it('swallows errors when tab is gone', async () => {
    (browser.tabs.get as jest.Mock).mockRejectedValueOnce(new Error('No tab'));

    await expect(
      handoffRestoringTabToExtension(platform, {
        tabId: 99,
        tabUrl: 'https://metamask.io/restoring#frag',
      }),
    ).resolves.toBeUndefined();
  });
});
