import browser from 'webextension-polyfill';
import log from 'loglevel';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { isObject } from '@metamask/utils';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import type { Preferences } from '../../../shared/types/preferences';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import type { RootMessenger } from '../lib/messenger';

// How long to wait for the request to open sidepanel before falling back to notification window
const roundtripTimeoutMs = 500;

type PendingOpen = {
  resolve: (opened: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
};

export type SidePanelToolbarBehaviorController = {
  preferencesController?: {
    state?: {
      preferences?: Pick<Preferences, 'useSidePanelAsDefault'>;
    };
  };
  controllerMessenger?: Pick<RootMessenger, 'subscribe'>;
};

export type SidePanelToolbarBehaviorDeps = {
  getController: () => SidePanelToolbarBehaviorController | null | undefined;
  waitUntilInitialized: () => Promise<void>;
};

export type SidePanelBehaviorApi = {
  setPanelBehavior?: (behavior: {
    openPanelOnActionClick: boolean;
  }) => Promise<void>;
};

export type SidePanelApiWithBehavior = SidePanelBehaviorApi & {
  setPanelBehavior: NonNullable<SidePanelBehaviorApi['setPanelBehavior']>;
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

function getSidePanelApi(
  sidePanel: SidePanelBehaviorApi | undefined = chrome.sidePanel,
): SidePanelApiWithBehavior | undefined {
  if (typeof sidePanel?.setPanelBehavior !== 'function') {
    return undefined;
  }
  return sidePanel as SidePanelApiWithBehavior;
}

function getUseSidePanelAsDefault(
  controller: SidePanelToolbarBehaviorController | null | undefined,
): boolean {
  return (
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true
  );
}

/**
 * Prefer opening the side panel on toolbar click as soon as the service worker starts.
 * Without this, the first click after a cold start can use manifest `default_popup` until
 * {@link setupSidePanelToolbarBehavior} runs after initialization.
 *
 * @param sidePanelApi - Side panel API with `setPanelBehavior` (validated by caller).
 */
export function applyEarlySidePanelToolbarBehavior(
  sidePanelApi: SidePanelApiWithBehavior,
): void {
  sidePanelApi.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Non-fatal: `applyToolbarSidePanelBehavior` applies persisted preference once ready.
  });
}

export async function applyToolbarSidePanelBehavior(
  getController: SidePanelToolbarBehaviorDeps['getController'],
  sidePanelApi: SidePanelApiWithBehavior,
): Promise<void> {
  const useSidePanelAsDefault = getUseSidePanelAsDefault(getController());
  await sidePanelApi.setPanelBehavior({
    openPanelOnActionClick: useSidePanelAsDefault,
  });
}

/**
 * Sets initial side panel toolbar behavior after startup, then subscribes only to
 * `useSidePanelAsDefault` changes (not every PreferencesController update).
 *
 * @param deps - Injected controller accessor and initialization gate.
 * @param sidePanel - Optional side panel API override for tests.
 */
export async function setupSidePanelToolbarBehavior(
  deps: SidePanelToolbarBehaviorDeps,
  sidePanel: SidePanelBehaviorApi | undefined = chrome.sidePanel,
): Promise<void> {
  const sidePanelApi = getSidePanelApi(sidePanel);
  if (!sidePanelApi) {
    return;
  }

  applyEarlySidePanelToolbarBehavior(sidePanelApi);

  try {
    await deps.waitUntilInitialized();
    await applyToolbarSidePanelBehavior(deps.getController, sidePanelApi);

    const controller = deps.getController();
    controller?.controllerMessenger?.subscribe(
      'PreferencesController:stateChange',
      (useSidePanelAsDefault) => {
        sidePanelApi
          .setPanelBehavior({
            openPanelOnActionClick: useSidePanelAsDefault,
          })
          .catch((error) =>
            console.error('Error updating panel behavior:', error),
          );
      },
      (preferencesControllerState: PreferencesControllerState) =>
        preferencesControllerState.preferences?.useSidePanelAsDefault ?? true,
    );
  } catch (error) {
    console.error('Error setting side panel toolbar behavior:', error);
  }
}
