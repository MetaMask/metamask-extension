import browser from 'webextension-polyfill';
import { CONTENT_SCRIPT } from './constants/stream';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';

const isSidepanelEnabled = process.env.IS_SIDEPANEL === 'true';

const notifyBackgroundToOpenSidepanel = () => {
  browser.runtime
    .sendMessage({ type: EXTENSION_MESSAGES.OPEN_SIDEPANEL })
    .catch(() => {
      // Background will handle as appropriate
    });
};

/**
 * Listens for methods requiring approval and notifies background to open sidepanel.
 * Must be called synchronously to preserve user gesture context.
 */
export const setupSidepanelListener = () => {
  // Skip in E2E tests until tests have been updated to use sidepanel
  if (process.env.IN_TEST || !isSidepanelEnabled) {
    return;
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.target !== CONTENT_SCRIPT) {
      return;
    }
    // Send for any RPC call - background will handle appropriately
    if (event.data?.data?.data?.method) {
      notifyBackgroundToOpenSidepanel();
    }
  });
};

type Props = {
  isSidepanelPreferred: () => boolean;
};

export const setupSidepanelMessageHandler = ({
  isSidepanelPreferred,
}: Props) => {
  // Skip in E2E tests until tests have been updated to use sidepanel
  if (process.env.IN_TEST || !isSidepanelEnabled) {
    return;
  }

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === EXTENSION_MESSAGES.OPEN_SIDEPANEL) {
      const sidepanelPreferred = isSidepanelPreferred();

      if (
        sidepanelPreferred &&
        // @ts-expect-error sidePanel API not in webextension-polyfill types yet
        browser.sidePanel?.open &&
        sender?.tab?.id
      ) {
        // @ts-expect-error sidePanel API not in webextension-polyfill types yet
        browser.sidePanel.open({ tabId: sender.tab.id }).catch(() => {
          // Notification window will be used as fallback
        });
      }
      return true;
    }
    return undefined;
  });
};
