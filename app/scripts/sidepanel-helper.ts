import browser from 'webextension-polyfill';
import { CONTENT_SCRIPT } from './constants/stream';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';

const isSidepanelEnabled = process.env.IS_SIDEPANEL === 'true';

const METHODS_REQUIRING_UI = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'wallet_addEthereumChain',
  'wallet_switchEthereumChain',
  'wallet_requestPermissions',
  'eth_requestAccounts',
  'wallet_requestSnaps',
];

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
    const method = event.data?.data?.data?.method;
    if (method && METHODS_REQUIRING_UI.includes(method)) {
      notifyBackgroundToOpenSidepanel();
    }
  });
};

type Props = {
  getUseSidePanelAsDefault: () => boolean;
};

export const setupSidepanelMessageHandler = ({
  getUseSidePanelAsDefault,
}: Props) => {
  // Skip in E2E tests until tests have been updated to use sidepanel
  if (process.env.IN_TEST || !isSidepanelEnabled) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browserWithSidePanel = browser as any;

  browser.runtime.onMessage.addListener(
    (message: { type?: string }, sender: browser.Runtime.MessageSender) => {
      if (message?.type === EXTENSION_MESSAGES.OPEN_SIDEPANEL) {
        const useSidePanelAsDefault = getUseSidePanelAsDefault();

        if (
          useSidePanelAsDefault &&
          browserWithSidePanel?.sidePanel?.open &&
          sender?.tab?.id
        ) {
          browserWithSidePanel.sidePanel
            .open({ tabId: sender.tab.id })
            .catch(() => {
              // Notification window will be used as fallback
            });
        }
        return true;
      }
      return undefined;
    },
  );
};
