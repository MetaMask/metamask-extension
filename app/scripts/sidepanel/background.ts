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
 * Counts Chrome side-panel extension contexts.
 *
 * Returns null when the API is missing or the query fails. Callers then keep
 * the port-based count, so a probe failure cannot hide a side panel that is
 * actually open.
 *
 * @returns The number of side-panel contexts, or null when the count is unknown.
 */
export async function getOpenSidePanelContextCount(): Promise<number | null> {
  const runtime = globalThis.chrome?.runtime;
  if (typeof runtime?.getContexts !== 'function') {
    return null;
  }

  try {
    const contexts = await runtime.getContexts({
      contextTypes: [runtime.ContextType.SIDE_PANEL],
    });
    return contexts.length;
  } catch {
    return null;
  }
}

/**
 * Returns whether a positive side-panel port count is leftover from a panel
 * that is no longer open.
 *
 * Saving the popup preference does not decrement `openSidePanelCount`. The
 * count drops only when the side-panel port disconnects, and closing the panel
 * with `window.close()` does not always disconnect it. While the user prefers
 * the popup, confirm with Chrome that a side-panel context still exists.
 * When the side panel is the preferred view, or the context query is
 * unavailable, the port count stands.
 *
 * @param options - Port count, preference, and optional context probe.
 * @param options.openSidePanelCount - Current side-panel port count.
 * @param options.preferSidePanel - Whether dapp prompts should use the side panel.
 * @param options.getLiveSidePanelCount - Probe for live side-panel contexts.
 * @returns True when the port count should be cleared before opening a popup.
 */
export async function isSidePanelCountStale({
  openSidePanelCount,
  preferSidePanel,
  getLiveSidePanelCount = getOpenSidePanelContextCount,
}: {
  openSidePanelCount: number;
  preferSidePanel: boolean;
  getLiveSidePanelCount?: () => Promise<number | null>;
}): Promise<boolean> {
  if (openSidePanelCount <= 0 || preferSidePanel) {
    return false;
  }

  const liveCount = await getLiveSidePanelCount();
  return liveCount === 0;
}

/**
 * Applies one side-panel port closing.
 *
 * Disconnects reserved by {@link dropStaleSidePanelCount} are consumed without
 * decrementing a side panel that opened after the stale count was cleared.
 *
 * @param openCount - Current side-panel port count.
 * @param ignoredDisconnects - Disconnect events still owed by a stale reset.
 * @returns The next count and remaining ignored disconnects.
 */
export function noteSidePanelDisconnected(
  openCount: number,
  ignoredDisconnects: number,
): { openCount: number; ignoredDisconnects: number } {
  if (ignoredDisconnects > 0) {
    return {
      openCount,
      ignoredDisconnects: ignoredDisconnects - 1,
    };
  }

  return {
    openCount: Math.max(openCount - 1, 0),
    ignoredDisconnects,
  };
}

/**
 * Clears a side-panel port count that no longer matches an open panel.
 *
 * Each cleared connection reserves one future disconnect so the late port
 * close cannot decrement a side panel opened in the meantime.
 *
 * @param openCount - Current side-panel port count.
 * @param ignoredDisconnects - Disconnect events already reserved.
 * @returns A zero open count and the reserved disconnect total.
 */
export function dropStaleSidePanelCount(
  openCount: number,
  ignoredDisconnects: number,
): { openCount: number; ignoredDisconnects: number } {
  return {
    openCount: 0,
    ignoredDisconnects: ignoredDisconnects + openCount,
  };
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
