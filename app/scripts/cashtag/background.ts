import type { CaipAssetType } from '@metamask/utils';
import browser from 'webextension-polyfill';
import { POPUP_FILE, SIDEPANEL_FILE } from '../../../shared/constants/app';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { fetchPriceHistory, resolveTicker } from './lib/data';
import type { Controller } from './lib/types';

const swapRoute = '/cross-chain/swaps/prepare-bridge-page';
const xTabUrlPatterns = ['*://x.com/*', '*://www.x.com/*'];
const popupResetDelayMs = 1000;
// Side panel must not use a hash in setOptions — Chrome reuses that path on
// reopen and leaves the user stuck on swap/asset. Cold open uses OPEN_ROUTE
// retries instead once the panel document mounts.
const openRouteRetryDelaysMs = [0, 150, 400];

let registered = false;

async function broadcastTickerWidgetEnabled(enabled: boolean) {
  try {
    const tabs = await browser.tabs.query({ url: xTabUrlPatterns });
    await Promise.all(
      tabs.map((tab) =>
        typeof tab.id === 'number'
          ? browser.tabs
              .sendMessage(tab.id, {
                type: EXTENSION_MESSAGES.X_WIDGET_ENABLED_CHANGED,
                body: { enabled },
              })
              .catch(() => undefined)
          : Promise.resolve(),
      ),
    );
  } catch {
    // Tabs without the content script (or query failures) are ignored.
  }
}

function bodyString(message: { body?: Record<string, unknown> }, key: string) {
  const value = message.body?.[key];
  return typeof value === 'string' ? value : null;
}

function swapRouteSearchForDest(caipAssetId: string): `?${string}` {
  return `?to=${encodeURIComponent(caipAssetId)}`;
}

function assetRoutePath(caipAssetId: string) {
  return buildAssetRoutePath(caipAssetId as CaipAssetType);
}

function routeHash(path: string, search?: `?${string}`) {
  return `#${path}${search ?? ''}`;
}

function shouldUseSidePanel(controller: Controller | undefined) {
  const preferred =
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true;
  return preferred && Boolean(globalThis.chrome?.sidePanel?.open);
}

function broadcastOpenRoute(path: string, search?: `?${string}`) {
  return browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.OPEN_ROUTE,
      body: {
        path,
        ...(search ? { search } : {}),
      },
    })
    .catch(() => undefined);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function broadcastOpenRouteWithRetries(
  path: string,
  search?: `?${string}`,
) {
  for (const delayMs of openRouteRetryDelaysMs) {
    if (delayMs > 0) {
      await delay(delayMs);
    }
    await broadcastOpenRoute(path, search);
  }
}

async function resetSidePanelPath(tabId?: number) {
  const sidePanel = globalThis.chrome?.sidePanel;
  if (!sidePanel?.setOptions) {
    return;
  }

  // Clear both global and tab-scoped options — either may retain a prior hash.
  await sidePanel.setOptions({ path: SIDEPANEL_FILE, enabled: true });
  if (typeof tabId === 'number') {
    await sidePanel.setOptions({
      tabId,
      path: SIDEPANEL_FILE,
      enabled: true,
    });
  }
}

async function openSidePanel(sender: {
  tab?: { windowId?: number; id?: number };
}) {
  const sidePanel = globalThis.chrome?.sidePanel;
  if (!sidePanel?.open || !sidePanel?.setOptions) {
    throw new Error('sidepanel-unavailable');
  }

  const tabId = sender?.tab?.id;
  const windowId = sender?.tab?.windowId;

  await resetSidePanelPath(tabId);

  let openOptions: { windowId: number } | { tabId: number } | null = null;
  if (typeof windowId === 'number') {
    openOptions = { windowId };
  } else if (typeof tabId === 'number') {
    openOptions = { tabId };
  }
  if (!openOptions) {
    throw new Error('sidepanel-no-window');
  }

  await sidePanel.open(openOptions);
}

async function openPopupWithRoute(hash: string) {
  const action = globalThis.chrome?.action;
  const openPopupFn = action?.openPopup;
  if (!action?.setPopup || typeof openPopupFn !== 'function') {
    throw new Error('popup-unavailable');
  }

  await action.setPopup({ popup: `${POPUP_FILE}${hash}` });
  try {
    await openPopupFn.call(action);
  } finally {
    // Delay reset so the popup document can start loading the hash URL.
    globalThis.setTimeout(() => {
      action.setPopup({ popup: POPUP_FILE }).catch(() => undefined);
    }, popupResetDelayMs);
  }
}

async function openExtensionPage({
  controller,
  sender,
  path,
  search,
  caipAssetId,
}: {
  controller: Controller | undefined;
  sender: { tab?: { windowId?: number; id?: number } };
  path: string;
  search?: `?${string}`;
  caipAssetId: string | null;
}) {
  const hash = routeHash(path, search);

  try {
    if (shouldUseSidePanel(controller)) {
      // Sidepanel: default path only + OPEN_ROUTE (retries cover cold mount).
      await openSidePanel(sender);
      await broadcastOpenRouteWithRetries(path, search);
    } else {
      // Popup is destroyed on close, so a one-shot hash deep link is safe.
      await openPopupWithRoute(hash);
      await broadcastOpenRoute(path, search);
    }
  } catch {
    await openPopupWithRoute(hash);
    await broadcastOpenRoute(path, search);
  }

  return {
    type: EXTENSION_MESSAGES.OPEN_EXTENSION,
    body: { ok: true, caipAssetId },
  };
}

export function registerCashtagBackgroundBridge({
  getController,
}: {
  getController: () => Controller | undefined;
}) {
  if (registered) {
    return;
  }
  registered = true;

  getController()?.controllerMessenger?.subscribe(
    'PreferencesController:stateChange',
    (enabled) => {
      broadcastTickerWidgetEnabled(enabled).catch(() => undefined);
    },
    (state) => state?.preferences?.showTickerWidget ?? true,
  );

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG) {
      const flagName = bodyString(message, 'flagName');
      if (!flagName) {
        return undefined;
      }
      const controller = getController();
      const flags = {
        ...controller?.remoteFeatureFlagController?.state?.remoteFeatureFlags,
        ...getManifestFlags().remoteFeatureFlags,
      };
      return Promise.resolve({
        type: EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG,
        body: {
          flagName,
          enabled: getBooleanFeatureFlag(flags[flagName], false),
        },
      });
    }

    if (message?.type === EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED) {
      const controller = getController();
      const enabled =
        controller?.preferencesController?.state?.preferences
          ?.showTickerWidget ?? true;
      return Promise.resolve({
        type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
        body: { enabled },
      });
    }

    if (message?.type === EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED) {
      const controller = getController();
      const enabled = message.body?.enabled === true;
      controller?.preferencesController?.setPreference?.(
        'showTickerWidget',
        enabled,
      );
      return Promise.resolve({
        type: EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
        body: { enabled },
      });
    }

    if (message?.type === EXTENSION_MESSAGES.GET_DATA) {
      const fields = Array.isArray(message.body?.fields)
        ? message.body.fields.filter(
            (field: unknown): field is string => typeof field === 'string',
          )
        : [];
      const wantsPriceHistory = fields.includes('priceHistory');
      const caipAssetId = bodyString(message, 'caipAssetId');

      if (wantsPriceHistory) {
        if (!caipAssetId) {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.GET_DATA,
            body: { priceHistory: null },
          });
        }
        return fetchPriceHistory(caipAssetId)
          .then((priceHistory) => ({
            type: EXTENSION_MESSAGES.GET_DATA,
            body: { priceHistory },
          }))
          .catch(() => ({
            type: EXTENSION_MESSAGES.GET_DATA,
            body: { priceHistory: null },
          }));
      }

      const symbol = bodyString(message, 'symbol');
      if (!symbol) {
        return Promise.resolve({
          type: EXTENSION_MESSAGES.GET_DATA,
          body: { asset: null, similar: [] },
        });
      }
      return resolveTicker(symbol)
        .then((resolved) => ({
          type: EXTENSION_MESSAGES.GET_DATA,
          body: resolved
            ? { asset: resolved.primary, similar: resolved.similar }
            : { asset: null, similar: [] },
        }))
        .catch(() => ({
          type: EXTENSION_MESSAGES.GET_DATA,
          body: { asset: null, similar: [] },
        }));
    }

    if (message?.type === EXTENSION_MESSAGES.OPEN_EXTENSION) {
      const page = bodyString(message, 'page');
      const caipAssetId = bodyString(message, 'caipAssetId');

      if (page === 'swap') {
        return openExtensionPage({
          controller: getController(),
          sender,
          path: swapRoute,
          ...(caipAssetId
            ? { search: swapRouteSearchForDest(caipAssetId) }
            : {}),
          caipAssetId,
        }).catch((error: unknown) => ({
          type: EXTENSION_MESSAGES.OPEN_EXTENSION,
          body: {
            ok: false,
            reason: 'open-failed',
            error: error instanceof Error ? error.message : 'unknown',
          },
        }));
      }

      if (page === 'asset') {
        if (!caipAssetId) {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.OPEN_EXTENSION,
            body: { ok: false, reason: 'missing-caip-asset-id' },
          });
        }
        try {
          return openExtensionPage({
            controller: getController(),
            sender,
            path: assetRoutePath(caipAssetId),
            caipAssetId,
          }).catch((error: unknown) => ({
            type: EXTENSION_MESSAGES.OPEN_EXTENSION,
            body: {
              ok: false,
              reason: 'open-failed',
              error: error instanceof Error ? error.message : 'unknown',
            },
          }));
        } catch {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.OPEN_EXTENSION,
            body: { ok: false, reason: 'invalid-caip-asset-id' },
          });
        }
      }

      return Promise.resolve({
        type: EXTENSION_MESSAGES.OPEN_EXTENSION,
        body: { ok: false, reason: 'invalid-page' },
      });
    }

    return undefined;
  });
}
