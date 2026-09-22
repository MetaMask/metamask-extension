import browser from 'webextension-polyfill';
import type { Tabs, Windows } from 'webextension-polyfill';
import { isWebOrigin } from '../util';

export type AppActiveTabData = {
  id: number;
  title: string;
  origin: string;
  protocol: string;
  url: string;
  host: string;
  href: string;
  favIconUrl?: string;
};

export type ActiveTabTrackerController = {
  appStateController: {
    state: {
      appActiveTab?: {
        id?: number;
      };
    };
    setAppActiveTab: (tabData: AppActiveTabData) => void;
    clearAppActiveTab: () => void;
  };
  subjectMetadataController: {
    addSubjectMetadata: (metadata: {
      origin: string;
      name: string;
      iconUrl: string | null;
      subjectType: 'website';
    }) => void;
  };
};

export type InstallActiveTabTrackerDeps = {
  getController: () => ActiveTabTrackerController | null | undefined;
  getIsInitialized: () => Promise<void>;
};

export type ActiveTabTrackerApi = {
  refreshAppActiveTab: (windowId?: number) => Promise<void>;
};

type TabLike = Pick<Tabs.Tab, 'id' | 'title' | 'url' | 'favIconUrl'>;

export function syncAppActiveTabFromTab(
  controller: ActiveTabTrackerController,
  tabInfo: TabLike,
): void {
  const { id, title, url, favIconUrl } = tabInfo;

  if (!url) {
    // Clear appActiveTab when there's no URL (e.g., new blank tab)
    controller.appStateController.clearAppActiveTab();
    return;
  }

  const { origin, protocol, host, href } = new URL(url);

  if (!isWebOrigin(origin)) {
    // Clear appActiveTab for non-web pages (chrome://, about:, extensions, etc.)
    controller.appStateController.clearAppActiveTab();
    return;
  }

  // Update appActiveTab with current active tab info
  controller.appStateController.setAppActiveTab({
    id: id as number,
    title: title ?? '',
    origin,
    protocol,
    url,
    host,
    href,
    favIconUrl,
  });

  // Update subject metadata for permission system
  controller.subjectMetadataController.addSubjectMetadata({
    origin,
    name: title || host || origin,
    iconUrl: favIconUrl ?? null,
    subjectType: 'website',
  });
}

async function isTabActiveInCurrentWindow(
  tabId: number | undefined,
): Promise<boolean> {
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTabs.some((activeTab) => activeTab.id === tabId);
}

/**
 * Keeps `appActiveTab` and subject metadata in sync with the focused tab
 * (startup refresh, tab/window listeners). Returns `refreshAppActiveTab` for
 * the side panel connection wiring.
 *
 * @param options - Injected controller accessor and initialization gate.
 * @param options.getController - Returns the MetaMask controller when ready.
 * @param options.getIsInitialized - Returns the current initialization promise
 * (must be re-read after critical-error recovery replaces it in `background.js`).
 */
export function installActiveTabTracker({
  getController,
  getIsInitialized,
}: InstallActiveTabTrackerDeps): ActiveTabTrackerApi {
  /**
   * Helper function to refresh appActiveTab by querying the current active tab.
   * This is used when the sidepanel opens to ensure it has the current tab info,
   * and when the focused window changes to keep appActiveTab in sync.
   *
   * @param windowId - If provided, queries the active tab in this specific
   * window. Otherwise queries the active tab in the current window.
   */
  const refreshAppActiveTab = async (windowId?: number) => {
    await getIsInitialized();
    const controller = getController();
    if (!controller) {
      return;
    }

    try {
      const queryOptions = windowId
        ? { active: true, windowId }
        : { active: true, currentWindow: true };

      const tabs = await browser.tabs.query(queryOptions);
      if (!tabs || tabs.length === 0) {
        return;
      }

      syncAppActiveTabFromTab(controller, tabs[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('Error refreshing appActiveTab:', message);
    }
  };

  // Initialize appActiveTab by querying the current active tab on startup
  refreshAppActiveTab();

  // Tab listeners to populate appActiveTab
  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    // Wait for controller to be initialized
    await getIsInitialized();
    const controller = getController();
    if (!controller) {
      return {};
    }

    try {
      const tabInfo = await browser.tabs.get(tabId);
      syncAppActiveTabFromTab(controller, tabInfo);
    } catch (error) {
      // Ignore errors from tabs that don't exist or can't be accessed
      const message = error instanceof Error ? error.message : String(error);
      console.log('Error in tabs.onActivated listener:', message);
    }

    return {};
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Wait for controller to be initialized
    await getIsInitialized();
    const controller = getController();
    if (!controller) {
      return {};
    }

    // Only update when URL changes or when page finishes loading
    // This prevents flickering from multiple updates during page load
    const urlChanged = changeInfo.url !== undefined;
    const statusComplete = changeInfo.status === 'complete';

    if (!urlChanged && !statusComplete) {
      return {};
    }

    try {
      // Use tab from parameter if available, otherwise fetch it.
      // The tab parameter is usually provided by Chrome, but may be undefined
      // in edge cases (e.g., when a tab is being removed), so we fall back to
      // fetching it explicitly.
      const tabInfo = tab || (await browser.tabs.get(tabId));
      const { id, url } = tabInfo;

      // Only update if this is the currently active tab
      // This prevents updating with stale data from background tabs
      const currentAppActiveTab =
        controller.appStateController.state.appActiveTab;
      const isActiveTab = currentAppActiveTab?.id === id;

      if (!url) {
        // Only clear if this is the currently active tab
        if (isActiveTab) {
          controller.appStateController.clearAppActiveTab();
        }
        return {};
      }

      const { origin } = new URL(url);

      // Skip if no origin, null origin, or extension pages
      if (!isWebOrigin(origin)) {
        // Only clear if this is the currently active tab
        if (isActiveTab) {
          controller.appStateController.clearAppActiveTab();
        }
        return {};
      }

      // Also check if this tab is actually the active tab in the current window.
      // This is needed because stored appActiveTab might be stale if the user
      // switched tabs quickly, or if tabs were closed/reopened. Querying the
      // browser ensures we only update for the truly active tab.
      let isActuallyActive = false;
      try {
        isActuallyActive = await isTabActiveInCurrentWindow(id);
      } catch {
        // Fallback to checking against stored active tab
        isActuallyActive = isActiveTab;
      }

      // Only update if URL changed and it's the active tab, or if status is complete and it's the active tab
      if ((urlChanged || statusComplete) && isActuallyActive) {
        syncAppActiveTabFromTab(controller, tabInfo);
      }
    } catch (error) {
      // Ignore errors from tabs that don't exist or can't be accessed
      const message = error instanceof Error ? error.message : String(error);
      console.log('Error in tabs.onUpdated listener:', message);
    }

    return {};
  });

  // Window focus listener to keep appActiveTab in sync across browser windows.
  // Without this, switching between Chrome windows can leave appActiveTab pointing
  // at the previously focused window's tab, causing
  // the connection bar [ui/components/multichain/dapp-connection-control-bar/dapp-connection-control-bar.tsx]
  // to disappear or appear on the wrong window.
  browser.windows.onFocusChanged.addListener(
    async (windowId: Windows.Window['id']) => {
      // WINDOW_ID_NONE means all browser windows lost focus (e.g., user switched
      // to another application). Keep appActiveTab unchanged so it stays correct
      // when the user returns to Chrome.
      if (windowId === browser.windows.WINDOW_ID_NONE) {
        return;
      }

      await refreshAppActiveTab(windowId);
    },
  );

  return { refreshAppActiveTab };
}
