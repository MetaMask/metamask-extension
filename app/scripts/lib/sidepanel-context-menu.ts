import browser from 'webextension-polyfill';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import type MetamaskController from '../metamask-controller';

const MENU_ITEM_ID = 'openSidePanel';

// Type augmentation for sidePanel API (not yet in webextension-polyfill types)
type BrowserWithSidePanel = typeof browser & {
  sidePanel?: {
    open: (options: { windowId: number }) => Promise<void>;
  };
};

export async function initSidePanelContextMenu(
  controller: MetamaskController,
): Promise<void> {
  const browserWithSidePanel = browser as BrowserWithSidePanel;

  if (
    !browser.contextMenus ||
    !browserWithSidePanel.sidePanel ||
    process.env.IS_SIDEPANEL?.toString() !== 'true'
  ) {
    return;
  }

  const isEnabled = (state?: {
    remoteFeatureFlags?: { extensionUxSidepanel?: boolean };
  }) => state?.remoteFeatureFlags?.extensionUxSidepanel !== false;

  const createMenu = () => {
    browser.contextMenus.create({
      id: MENU_ITEM_ID,
      title: 'MetaMask Sidepanel',
      contexts: ['all'],
    });
  };

  const removeMenu = () => {
    browser.contextMenus.remove(MENU_ITEM_ID);
  };

  if (isEnabled(controller?.remoteFeatureFlagController?.state)) {
    createMenu();
  }

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ITEM_ID && tab?.windowId) {
      browserWithSidePanel.sidePanel?.open({ windowId: tab.windowId });
    }
  });

  controller?.controllerMessenger?.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (state: RemoteFeatureFlagControllerState) => {
      if (isEnabled(state)) {
        createMenu();
      } else {
        removeMenu();
      }
    },
  );
}
