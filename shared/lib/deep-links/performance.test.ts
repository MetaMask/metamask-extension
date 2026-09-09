/* eslint-disable @typescript-eslint/naming-convention -- Sentry trace fields use snake_case */
import browser from 'webextension-polyfill';
import {
  clearPendingDeepLinkNavigation,
  getCurrentTabId,
  getDeepLinkUrlTags,
  getPendingDeepLinkNavigation,
  PENDING_DEEP_LINK_TTL,
  removeExpiredPendingDeepLinkNavigations,
  removePendingDeepLinkNavigation,
  setPendingDeepLinkNavigation,
  type PendingDeepLinkNavigation,
} from './performance';

const mockIsManifestV3 = jest.fn(() => true);

jest.mock('../mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3();
  },
}));

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      getKeys: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
    session: {
      get: jest.fn(),
      getKeys: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    getCurrent: jest.fn(),
  },
}));

const TAB_ID = 42;
const STORAGE_KEY = `deepLinkNavigationTrace:${TAB_ID}`;
const RECORD: PendingDeepLinkNavigation = {
  id: 'record-id',
  intakeTimestamp: 1_000,
  createdAt: 2_000,
  urlTags: {
    deeplink_route: 'swap',
    deeplink_variant: 'token',
    signed: true,
  },
  targetRoute: '/swap',
  interstitial: 'shown',
};

describe('deep-link performance helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockIsManifestV3.mockReturnValue(true);
  });

  describe('getDeepLinkUrlTags', () => {
    it('extracts route, screen variant, and signature presence', () => {
      expect(
        getDeepLinkUrlTags(
          'https://link.metamask.io/swap?tab=activity&screen=token&sig=invalid',
        ),
      ).toStrictEqual({
        deeplink_route: 'swap',
        deeplink_variant: 'token',
        signed: true,
      });
    });

    it('uses the hostname for custom-scheme links', () => {
      expect(getDeepLinkUrlTags('metamask://swap?tab=activity')).toStrictEqual({
        deeplink_route: 'swap',
        deeplink_variant: 'activity',
        signed: false,
      });
    });

    for (const variant of [
      'UPPERCASE',
      '1invalid',
      'too-many-characters-for-a-variant',
    ]) {
      it(`replaces invalid variant ${variant} with the default`, () => {
        expect(
          getDeepLinkUrlTags(`https://link.metamask.io/swap?screen=${variant}`)
            .deeplink_variant,
        ).toBe('default');
      });
    }

    it('returns safe defaults for an invalid URL', () => {
      expect(getDeepLinkUrlTags('not a URL')).toStrictEqual({
        deeplink_route: 'unknown',
        deeplink_variant: 'default',
        signed: false,
      });
    });
  });

  it('stores records in session storage for MV3', async () => {
    await setPendingDeepLinkNavigation(TAB_ID, RECORD);

    expect(browser.storage.session.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: RECORD,
    });
    expect(browser.storage.local.set).not.toHaveBeenCalled();
  });

  it('uses local storage for MV2', async () => {
    mockIsManifestV3.mockReturnValue(false);

    await setPendingDeepLinkNavigation(TAB_ID, RECORD);

    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: RECORD,
    });
  });

  it('reads a valid record', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(RECORD.createdAt);
    jest.mocked(browser.storage.session.get).mockResolvedValue({
      [STORAGE_KEY]: RECORD,
    });

    await expect(getPendingDeepLinkNavigation(TAB_ID)).resolves.toStrictEqual(
      RECORD,
    );
  });

  it('removes and ignores an expired record', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(RECORD.createdAt + PENDING_DEEP_LINK_TTL + 1);
    jest.mocked(browser.storage.session.get).mockResolvedValue({
      [STORAGE_KEY]: RECORD,
    });

    await expect(getPendingDeepLinkNavigation(TAB_ID)).resolves.toBeNull();
    expect(browser.storage.session.remove).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('does not remove a newer record', async () => {
    jest.mocked(browser.storage.session.get).mockResolvedValue({
      [STORAGE_KEY]: { ...RECORD, id: 'newer-id' },
    });

    await removePendingDeepLinkNavigation(TAB_ID, RECORD.id);

    expect(browser.storage.session.remove).not.toHaveBeenCalled();
  });

  it('clears an abandoned record unconditionally', async () => {
    await clearPendingDeepLinkNavigation(TAB_ID);

    expect(browser.storage.session.remove).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('sweeps only expired fallback records', async () => {
    mockIsManifestV3.mockReturnValue(false);
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(RECORD.createdAt + PENDING_DEEP_LINK_TTL + 1);
    jest
      .mocked(browser.storage.local.getKeys)
      .mockResolvedValue([STORAGE_KEY, 'unrelated']);
    jest.mocked(browser.storage.local.get).mockResolvedValue({
      [STORAGE_KEY]: RECORD,
    });

    await removeExpiredPendingDeepLinkNavigations();

    expect(browser.storage.local.get).toHaveBeenCalledWith([STORAGE_KEY]);
    expect(browser.storage.local.remove).toHaveBeenCalledWith([STORAGE_KEY]);
  });

  it('returns the current full-tab ID', async () => {
    jest
      .mocked(browser.tabs.getCurrent)
      .mockResolvedValue({ id: TAB_ID } as browser.Tabs.Tab);

    await expect(getCurrentTabId()).resolves.toBe(TAB_ID);
  });

  it('returns null when there is no current tab', async () => {
    jest
      .mocked(browser.tabs.getCurrent)
      .mockResolvedValue({} as browser.Tabs.Tab);

    await expect(getCurrentTabId()).resolves.toBeNull();
  });
});
