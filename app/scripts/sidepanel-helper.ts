import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import { CONTENT_SCRIPT } from './constants/stream';

/**
 * Sets up a listener for RPC calls and notifies background to open sidepanel.
 * Called from setupPageStreams
 */
export const setupSidepanelListener = () => {
  if (process.env.IN_TEST) {
    return;
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.target !== CONTENT_SCRIPT) {
      return;
    }

    const method = event.data?.data?.data?.method;
    if (method) {
      browser.runtime
        .sendMessage({ type: EXTENSION_MESSAGES.OPEN_SIDEPANEL })
        .catch(() => {
          // Background will handle as appropriate
        });
    }
  });
};

type Props = {
  isSidepanelPreferred: () => boolean;
};

export const setupSidepanelMessageHandler = ({
  isSidepanelPreferred,
}: Props) => {
  if (process.env.IN_TEST) {
    return;
  }

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== EXTENSION_MESSAGES.OPEN_SIDEPANEL) {
      return undefined;
    }

    if (
      isSidepanelPreferred() &&
      // @ts-expect-error sidePanel API not in webextension-polyfill types yet
      browser.sidePanel?.open &&
      sender?.tab?.id
    ) {
      // @ts-expect-error sidePanel API not in webextension-polyfill types yet
      browser.sidePanel.open({ tabId: sender.tab.id }).catch(() => {
        // Failed to open sidepanel
      });
    }

    return undefined;
  });
};
