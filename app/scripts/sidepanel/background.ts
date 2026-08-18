import browser from 'webextension-polyfill';
import log from 'loglevel';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { isObject } from '@metamask/utils';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import type { Preferences } from '../../../shared/types/preferences';

// How long to wait for the request to open sidepanel before falling back to notification window
const roundtripTimeoutMs = 500;

type PendingOpen = {
  resolve: (opened: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
};

export function shouldUseSidepanel(
  controller: {
    preferencesController?: {
      state?: {
        preferences?: Pick<Preferences, 'useSidePanelAsDefault'>;
      };
    };
    remoteFeatureFlagController?: {
      state?: Pick<RemoteFeatureFlagControllerState, 'remoteFeatureFlags'>;
    };
  } | null,
): boolean {
  const isPreferred =
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true;
  const isSupported = Boolean(chrome.sidePanel?.open);
  const remoteFeatureFlags = getRemoteFeatureFlags({
    metamask: {
      remoteFeatureFlags:
        controller?.remoteFeatureFlagController?.state?.remoteFeatureFlags ??
        {},
    },
  });
  const isFlagEnabled = getBooleanFeatureFlag(
    remoteFeatureFlags.dappOpenSidepanelEnabled,
    false,
  );

  return isPreferred && isSupported && isFlagEnabled;
}

/**
 * Creates a sidepanel opener.
 *
 * @returns A function that sends a REQUEST_OPEN_SIDEPANEL message to the specified tab indicating whether the sidepanel was successfully opened
 */
export function createSidepanelOpener() {
  if (process.env.IN_TEST) {
    return () => Promise.resolve(false);
  }

  const pendingOpens = new Map<string, PendingOpen>();

  browser.runtime.onMessage.addListener(
    (message: unknown, sender: browser.Runtime.MessageSender) => {
      if (
        !isObject(message) ||
        message.type !== EXTENSION_MESSAGES.OPEN_SIDEPANEL ||
        typeof message.nonce !== 'string'
      ) {
        return undefined;
      }

      const entry = pendingOpens.get(message.nonce);
      if (!entry) {
        return undefined;
      }
      clearTimeout(entry.timer);
      pendingOpens.delete(message.nonce);

      const tabId = sender?.tab?.id;
      if (!tabId || !chrome.sidePanel?.open) {
        entry.resolve(false);
        return undefined;
      }

      // open() must run synchronously to consume the gesture the content script just forwarded
      chrome.sidePanel
        .open({ tabId })
        .then(() => entry.resolve(true))
        .catch((err: unknown) => {
          entry.resolve(false);
          log.warn('Failed to open sidepanel', err);
        });

      return undefined;
    },
  );

  function requestOpenSidePanel(tabId: number): Promise<boolean> {
    const nonce = `${Date.now()}:${Math.random()}`;

    const openPromise = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        pendingOpens.delete(nonce);
        resolve(false);
      }, roundtripTimeoutMs);

      pendingOpens.set(nonce, { resolve, timer });
    });

    browser.tabs
      .sendMessage(tabId, {
        type: EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL,
        nonce,
      })
      .catch((err) => {
        // Fail fast so triggerUi can open the notification window
        const entry = pendingOpens.get(nonce);
        if (!entry) {
          return;
        }
        clearTimeout(entry.timer);
        pendingOpens.delete(nonce);
        entry.resolve(false);

        log.warn('Failed to send request to tab', tabId, err);
      });

    return openPromise;
  }

  return requestOpenSidePanel;
}
