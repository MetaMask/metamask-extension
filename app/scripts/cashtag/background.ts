import { isCaipAssetType, type CaipAssetType } from '@metamask/utils';
import browser from 'webextension-polyfill';
import { POPUP_FILE, SIDEPANEL_FILE } from '#shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '#shared/constants/metametrics';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { buildAssetRoutePath } from '#shared/lib/asset-route';
import type { ManifestFlags } from '#shared/lib/manifestFlags';
import { getBooleanFeatureFlag } from '#shared/lib/remote-feature-flag-utils';
import { createEventBuilder, trackEvent } from '../controllers/analytics';
import { fetchPriceHistory, resolveTicker } from './lib/data';
import type { Controller } from './lib/types';

const swapRoute = '/cross-chain/swaps/prepare-bridge-page';
const xTabUrlPatterns = ['*://x.com/*', '*://www.x.com/*'];
const xHosts = new Set(['x.com', 'www.x.com']);
const widgetFramePath = 'cashtag-widget.html';
const popupResetDelayMs = 1000;
// Retry delays for broadcasting OPEN_ROUTE after a cold open,
// since the panel document may not have mounted
const openRouteRetryDelaysMs = [0, 150, 400];

let registered = false;

function parsedUrl(value: string | undefined) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isXPageSender(sender: chrome.runtime.MessageSender) {
  const url = parsedUrl(sender.url);
  return (
    sender.id === chrome.runtime.id &&
    url !== null &&
    (url.protocol === 'https:' || url.protocol === 'http:') &&
    xHosts.has(url.hostname)
  );
}

function isXContentScriptSender(sender: chrome.runtime.MessageSender) {
  return sender.frameId === 0 && isXPageSender(sender);
}

function isWidgetFrameSender(sender: chrome.runtime.MessageSender) {
  const url = parsedUrl(sender.url);
  const tabUrl = parsedUrl(sender.tab?.url);
  const expectedUrl = new URL(chrome.runtime.getURL(widgetFramePath));
  return (
    sender.id === chrome.runtime.id &&
    typeof sender.frameId === 'number' &&
    sender.frameId > 0 &&
    url?.protocol === expectedUrl.protocol &&
    url.hostname === expectedUrl.hostname &&
    url.pathname === expectedUrl.pathname &&
    tabUrl !== null &&
    xHosts.has(tabUrl.hostname)
  );
}

export function isAllowedCashtagSender(
  messageType: unknown,
  sender: chrome.runtime.MessageSender,
) {
  if (messageType === EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED) {
    return isXPageSender(sender);
  }
  if (messageType === EXTENSION_MESSAGES.GET_DATA) {
    return isXContentScriptSender(sender) || isWidgetFrameSender(sender);
  }
  if (
    messageType === EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED ||
    messageType === EXTENSION_MESSAGES.OPEN_EXTENSION
  ) {
    return isWidgetFrameSender(sender);
  }
  return false;
}

async function broadcastTickerWidgetEnabled(enabled: boolean) {
  try {
    const tabs = await browser.tabs.query({ url: xTabUrlPatterns });
    await Promise.all(
      tabs.map((tab) =>
        typeof tab.id === 'number'
          ? browser.tabs
              .sendMessage(
                tab.id,
                {
                  type: EXTENSION_MESSAGES.X_WIDGET_ENABLED_CHANGED,
                  body: { enabled },
                },
                { frameId: 0 },
              )
              .catch(() => undefined)
          : Promise.resolve(),
      ),
    );
  } catch {
    // Tabs without the content script are ignored
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

// Scoped to this module rather than shared/lib/manifestFlags, whose
// getManifestFlags() bails out in non-Jest environments and would need a
// global behaviour change to read _flags in a real build.
function manifestRemoteFeatureFlags() {
  const manifest = globalThis.chrome?.runtime?.getManifest?.() as
    | { _flags?: ManifestFlags }
    | undefined;
  return manifest?._flags?.remoteFeatureFlags;
}

function isCashtagInjectionFlagEnabled(controller: Controller | undefined) {
  const flags = {
    ...controller?.remoteFeatureFlagController?.state?.remoteFeatureFlags,
    ...manifestRemoteFeatureFlags(),
  };
  // return getBooleanFeatureFlag(flags.cashtagInjection, false);
  return true; // TODO: enable cashtag injection flag when ready
}

function isTickerWidgetEnabled(controller: Controller | undefined) {
  const preferenceEnabled =
    controller?.preferencesController?.state?.preferences?.showTickerWidget ??
    true;
  return isCashtagInjectionFlagEnabled(controller) && preferenceEnabled;
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

  // Tab-scoped options override the global default, so reset both to ensure
  // the panel opens at SIDEPANEL_FILE rather than a path set by a prior open.
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
  if (!action?.setPopup || typeof action.openPopup !== 'function') {
    throw new Error('popup-unavailable');
  }

  await action.setPopup({ popup: `${POPUP_FILE}${hash}` });
  try {
    await action.openPopup();
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
    () => {
      broadcastTickerWidgetEnabled(
        isTickerWidgetEnabled(getController()),
      ).catch(() => undefined);
    },
    (state) => state?.preferences?.showTickerWidget ?? true,
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isAllowedCashtagSender(message?.type, sender)) {
      return false;
    }

    const response = (() => {
      if (message?.type === EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED) {
        return Promise.resolve({
          type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
          body: {
            enabled:
              sender.frameId === 0 && isTickerWidgetEnabled(getController()),
          },
        });
      }

      if (message?.type === EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED) {
        const controller = getController();
        const enabled = message.body?.enabled === true;
        const previous =
          controller?.preferencesController?.state?.preferences
            ?.showTickerWidget ?? true;
        controller?.preferencesController?.setPreference?.(
          'showTickerWidget',
          enabled,
        );
        if (previous !== enabled) {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.SettingsUpdated)
              .addCategory(MetaMetricsEventCategory.Settings)
              .addProperties({
                /* eslint-disable @typescript-eslint/naming-convention */
                settings_group: 'preferences_and_display',
                settings_type: 'show_metamask_widget_on_x',
                old_value: previous,
                new_value: enabled,
                show_metamask_widget_on_x: enabled,
                /* eslint-enable @typescript-eslint/naming-convention */
                location: 'x_widget',
              })
              .build(),
          );
        }
        return Promise.resolve({
          type: EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
          body: { enabled },
        });
      }

      if (message?.type === EXTENSION_MESSAGES.GET_DATA) {
        if (!isTickerWidgetEnabled(getController())) {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.GET_DATA,
            body: { asset: null, similar: [], priceHistory: null },
          });
        }

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
        if (!isTickerWidgetEnabled(getController())) {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.OPEN_EXTENSION,
            body: { ok: false, reason: 'disabled' },
          });
        }

        const page = bodyString(message, 'page');
        const caipAssetId = bodyString(message, 'caipAssetId');

        if (!caipAssetId) {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.OPEN_EXTENSION,
            body: { ok: false, reason: 'missing-caip-asset-id' },
          });
        }
        if (!isCaipAssetType(caipAssetId)) {
          return Promise.resolve({
            type: EXTENSION_MESSAGES.OPEN_EXTENSION,
            body: { ok: false, reason: 'invalid-caip-asset-id' },
          });
        }

        if (page === 'swap') {
          return openExtensionPage({
            controller: getController(),
            sender,
            path: swapRoute,
            search: swapRouteSearchForDest(caipAssetId),
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
    })();

    if (response === undefined) {
      return false;
    }

    Promise.resolve(response)
      .then(sendResponse)
      .catch(() => sendResponse(undefined));
    return true;
  });

  broadcastTickerWidgetEnabled(isTickerWidgetEnabled(getController())).catch(
    () => undefined,
  );
}
