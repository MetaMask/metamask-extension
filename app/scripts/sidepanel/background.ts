import browser from 'webextension-polyfill';
import log from 'loglevel';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { isObject } from '@metamask/utils';
import { POPUP_FILE, POPUP_INIT_FILE } from '../../../shared/constants/app';
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

type PendingRoute = {
  path: string;
  search?: `?${string}`;
};

const pendingRoutes = new Map<number, PendingRoute>();
const popupRouteResetDelayMs = 1000;
let pendingRouteListenersRegistered = false;

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
  onPreferSidePanelChange?: (value: boolean) => void;
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

function getUseSidePanelAsDefaultFromPersistedState(
  persistedState: unknown,
): boolean | undefined {
  if (!isObject(persistedState) || !isObject(persistedState.data)) {
    return undefined;
  }

  const preferencesController = persistedState.data.PreferencesController;
  if (
    !isObject(preferencesController) ||
    !isObject(preferencesController.preferences)
  ) {
    return undefined;
  }

  const { useSidePanelAsDefault } = preferencesController.preferences;
  return typeof useSidePanelAsDefault === 'boolean'
    ? useSidePanelAsDefault
    : undefined;
}

/**
 * Read `useSidePanelAsDefault` from disk before the controller is ready so the
 * toolbar has a popup or side-panel target without manifest `default_popup`.
 */
async function readPersistedUseSidePanelAsDefault(): Promise<boolean> {
  const getPersistedState = globalThis.stateHooks?.getPersistedState;
  if (typeof getPersistedState !== 'function') {
    return true;
  }

  try {
    const persistedState = await getPersistedState({ reportErrors: false });
    return getUseSidePanelAsDefaultFromPersistedState(persistedState) ?? true;
  } catch {
    return true;
  }
}

async function applyToolbarSidePanelPreference(
  preferSidePanel: boolean,
  sidePanelApi: SidePanelApiWithBehavior,
) {
  if (preferSidePanel) {
    await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: true });
    await setActionPopup('');
    return;
  }

  await setActionPopup(POPUP_INIT_FILE);
  await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: false });
}

async function setActionPopup(popup: string) {
  const setPopup = globalThis.chrome?.action?.setPopup;
  if (typeof setPopup !== 'function') {
    return;
  }

  try {
    await setPopup({ popup });
  } catch (error) {
    log.warn('Failed to set toolbar popup', error);
  }
}

export async function applyToolbarSidePanelBehavior(
  getController: SidePanelToolbarBehaviorDeps['getController'],
  sidePanelApi: SidePanelApiWithBehavior,
): Promise<void> {
  await applyToolbarSidePanelPreference(
    getUseSidePanelAsDefault(getController()),
    sidePanelApi,
  );
}

export async function openRoute({
  controller,
  windowId,
  path,
  search,
}: {
  controller:
    | Pick<SidePanelToolbarBehaviorController, 'preferencesController'>
    | null
    | undefined;
  windowId?: number;
  path: string;
  search?: `?${string}`;
}) {
  registerPendingRouteListeners();

  const preferSidePanel =
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true;
  const hash = `#${path}${search ?? ''}`;

  if (
    preferSidePanel &&
    chrome.sidePanel?.open &&
    typeof windowId === 'number'
  ) {
    const pendingRoute = { path, search };
    pendingRoutes.set(windowId, pendingRoute);
    try {
      await chrome.sidePanel.open({ windowId });
      await browser.runtime
        .sendMessage({
          type: EXTENSION_MESSAGES.OPEN_ROUTE,
          body: { windowId },
        })
        .catch(() => undefined);
      return;
    } catch {
      if (pendingRoutes.get(windowId) === pendingRoute) {
        pendingRoutes.delete(windowId);
      }
    }
  }

  const { action } = chrome;
  if (!action?.setPopup || typeof action.openPopup !== 'function') {
    await openRouteInTab(hash);
    return;
  }

  const popupSet = action.setPopup({ popup: `${POPUP_FILE}${hash}` });
  const opened = action.openPopup();

  globalThis.setTimeout(() => {
    setActionPopup(preferSidePanel ? '' : POPUP_INIT_FILE).catch(
      () => undefined,
    );
  }, popupRouteResetDelayMs);

  try {
    await Promise.all([popupSet, opened]);
  } catch {
    await openRouteInTab(hash);
  }
}

function openRouteInTab(hash: string) {
  return browser.tabs.create({
    url: browser.runtime.getURL(`home.html${hash}`),
  });
}

function handleConsumePendingRoute(message: {
  body?: Record<string, unknown>;
}) {
  const windowId = message.body?.windowId;
  const entry =
    typeof windowId === 'number' ? pendingRoutes.get(windowId) : undefined;

  if (typeof windowId === 'number') {
    pendingRoutes.delete(windowId);
  }

  // MV3 reply delivery requires a Promise from onMessage (not a plain object).
  return Promise.resolve({
    type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
    body: entry
      ? { path: entry.path, search: entry.search ?? null }
      : { path: null, search: null },
  });
}

function registerPendingRouteListeners() {
  if (pendingRouteListenersRegistered) {
    return;
  }

  browser.runtime.onMessage.addListener(
    (message: unknown, sender: browser.Runtime.MessageSender) => {
      if (
        !isObject(message) ||
        message.type !== EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE ||
        sender.id !== chrome.runtime.id ||
        sender.tab ||
        !sender.url?.startsWith(chrome.runtime.getURL(''))
      ) {
        return undefined;
      }

      return handleConsumePendingRoute(message);
    },
  );

  const onWindowRemoved = chrome.windows?.onRemoved;
  if (typeof onWindowRemoved?.addListener === 'function') {
    onWindowRemoved.addListener((windowId: number) => {
      pendingRoutes.delete(windowId);
    });
  }

  pendingRouteListenersRegistered = true;
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
    await setActionPopup(POPUP_INIT_FILE);
    return;
  }

  try {
    await applyToolbarSidePanelPreference(
      await readPersistedUseSidePanelAsDefault(),
      sidePanelApi,
    );
  } catch (error) {
    log.warn('Failed to apply persisted toolbar preference', error);
  }

  try {
    await deps.waitUntilInitialized();
    await applyToolbarSidePanelBehavior(deps.getController, sidePanelApi);

    const controller = deps.getController();
    const preferSidePanel = getUseSidePanelAsDefault(controller);
    if (!preferSidePanel) {
      deps.onPreferSidePanelChange?.(false);
    }

    controller?.controllerMessenger?.subscribe(
      'PreferencesController:stateChange',
      (useSidePanelAsDefault) => {
        deps.onPreferSidePanelChange?.(useSidePanelAsDefault);
        applyToolbarSidePanelPreference(
          useSidePanelAsDefault,
          sidePanelApi,
        ).catch((error) =>
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
