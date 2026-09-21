import browser from 'webextension-polyfill';
import {
  installActiveTabTracker,
  syncAppActiveTabFromTab,
  type ActiveTabTrackerController,
} from './active-tab-tracker';

type TabActivatedListener = (info: { tabId: number }) => Promise<unknown>;
type TabUpdatedListener = (
  tabId: number,
  changeInfo: { url?: string; status?: string },
  tab?: { id?: number; title?: string; url?: string; favIconUrl?: string },
) => Promise<unknown>;
type WindowFocusListener = (windowId: number) => Promise<void>;

const tabActivatedListeners: TabActivatedListener[] = [];
const tabUpdatedListeners: TabUpdatedListener[] = [];
const windowFocusListeners: WindowFocusListener[] = [];

jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
    get: jest.fn(),
    onActivated: {
      addListener: (listener: TabActivatedListener) => {
        tabActivatedListeners.push(listener);
      },
    },
    onUpdated: {
      addListener: (listener: TabUpdatedListener) => {
        tabUpdatedListeners.push(listener);
      },
    },
  },
  windows: {
    WINDOW_ID_NONE: -1,
    onFocusChanged: {
      addListener: (listener: WindowFocusListener) => {
        windowFocusListeners.push(listener);
      },
    },
  },
}));

function createMockController(): ActiveTabTrackerController & {
  setAppActiveTab: jest.Mock;
  clearAppActiveTab: jest.Mock;
  addSubjectMetadata: jest.Mock;
} {
  const setAppActiveTab = jest.fn();
  const clearAppActiveTab = jest.fn();
  const addSubjectMetadata = jest.fn();

  return {
    appStateController: {
      state: { appActiveTab: undefined },
      setAppActiveTab,
      clearAppActiveTab,
    },
    subjectMetadataController: {
      addSubjectMetadata,
    },
    setAppActiveTab,
    clearAppActiveTab,
    addSubjectMetadata,
  };
}

describe('syncAppActiveTabFromTab', () => {
  it('sets appActiveTab and subject metadata for a web URL', () => {
    const controller = createMockController();

    syncAppActiveTabFromTab(controller, {
      id: 1,
      title: 'Example',
      url: 'https://example.com/path',
      favIconUrl: 'https://example.com/favicon.ico',
    });

    expect(controller.setAppActiveTab).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        title: 'Example',
        origin: 'https://example.com',
        url: 'https://example.com/path',
        favIconUrl: 'https://example.com/favicon.ico',
      }),
    );
    expect(controller.addSubjectMetadata).toHaveBeenCalledWith({
      origin: 'https://example.com',
      name: 'Example',
      iconUrl: 'https://example.com/favicon.ico',
      subjectType: 'website',
    });
  });

  it('clears appActiveTab when URL is missing', () => {
    const controller = createMockController();

    syncAppActiveTabFromTab(controller, {
      id: 2,
      title: 'New tab',
    });

    expect(controller.clearAppActiveTab).toHaveBeenCalled();
    expect(controller.setAppActiveTab).not.toHaveBeenCalled();
  });

  it('clears appActiveTab for non-web origins', () => {
    const controller = createMockController();

    syncAppActiveTabFromTab(controller, {
      id: 3,
      title: 'Settings',
      url: 'chrome://settings',
    });

    expect(controller.clearAppActiveTab).toHaveBeenCalled();
  });
});

describe('installActiveTabTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tabActivatedListeners.length = 0;
    tabUpdatedListeners.length = 0;
    windowFocusListeners.length = 0;
  });

  it('registers listeners and refreshes appActiveTab on install', async () => {
    const controller = createMockController();
    let resolveInit!: () => void;
    const isInitialized = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    (browser.tabs.query as jest.Mock).mockResolvedValue([
      {
        id: 10,
        title: 'Dapp',
        url: 'https://dapp.test',
      },
    ]);

    const { refreshAppActiveTab } = installActiveTabTracker({
      getController: () => controller,
      isInitialized,
    });

    expect(tabActivatedListeners).toHaveLength(1);
    expect(tabUpdatedListeners).toHaveLength(1);
    expect(windowFocusListeners).toHaveLength(1);

    resolveInit();
    await isInitialized;
    await Promise.resolve();

    expect(browser.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
    expect(controller.setAppActiveTab).toHaveBeenCalled();

    (browser.tabs.query as jest.Mock).mockResolvedValue([
      {
        id: 11,
        title: 'Other window',
        url: 'https://other.test',
      },
    ]);

    await refreshAppActiveTab(99);

    expect(browser.tabs.query).toHaveBeenCalledWith({
      active: true,
      windowId: 99,
    });
  });

  it('handles tabs.onActivated', async () => {
    const controller = createMockController();
    const isInitialized = Promise.resolve();

    installActiveTabTracker({
      getController: () => controller,
      isInitialized,
    });

    (browser.tabs.get as jest.Mock).mockResolvedValue({
      id: 5,
      title: 'Activated',
      url: 'https://activated.test',
    });

    await tabActivatedListeners[0]({ tabId: 5 });

    expect(controller.setAppActiveTab).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, origin: 'https://activated.test' }),
    );
  });

  it('ignores window focus when all windows lose focus', async () => {
    const controller = createMockController();
    const isInitialized = Promise.resolve();

    installActiveTabTracker({
      getController: () => controller,
      isInitialized,
    });

    await Promise.resolve();
    (browser.tabs.query as jest.Mock).mockClear();

    await windowFocusListeners[0](browser.windows.WINDOW_ID_NONE);

    expect(browser.tabs.query).not.toHaveBeenCalled();
  });

  it('updates on tabs.onUpdated when the tab is active in the current window', async () => {
    const controller = createMockController();
    controller.appStateController.state.appActiveTab = { id: 7 };
    const isInitialized = Promise.resolve();

    installActiveTabTracker({
      getController: () => controller,
      isInitialized,
    });

    (browser.tabs.query as jest.Mock).mockResolvedValue([{ id: 7 }]);

    await tabUpdatedListeners[0](
      7,
      { status: 'complete' },
      {
        id: 7,
        title: 'Updated',
        url: 'https://updated.test',
      },
    );

    expect(controller.setAppActiveTab).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://updated.test' }),
    );
  });
});
