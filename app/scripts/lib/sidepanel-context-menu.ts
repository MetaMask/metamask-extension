import browser from 'webextension-polyfill';
import type MetamaskController from '../metamask-controller';

const MENU_ITEM_ID = 'openSidePanel';

export async function initSidePanelContextMenu(
  controller: MetamaskController,
): Promise<void> {
  if (
    !browser.contextMenus ||
    !browser.sidePanel ||
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
    if (info.menuItemId === MENU_ITEM_ID) {
      browser.sidePanel.open({ windowId: tab.windowId });
    }
  });

  controller?.controllerMessenger?.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (state) => {
      if (isEnabled(state)) {
        createMenu();
      } else {
        removeMenu();
      }
    },
  );
}
