import type { CaipAssetType } from '@metamask/utils';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { fetchPriceHistory, resolveTicker } from './lib/data';
import type { Controller } from './lib/types';

const swapRoute = '/cross-chain/swaps/prepare-bridge-page';
const xTabUrlPatterns = ['*://x.com/*', '*://www.x.com/*'];

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

function shouldUseSidePanel(controller: Controller | undefined) {
  const preferred =
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true;
  return preferred && Boolean(globalThis.chrome?.sidePanel?.open);
}

function openPopupOrHome() {
  const openPopup = globalThis.chrome?.action?.openPopup;
  if (typeof openPopup === 'function') {
    return Promise.resolve(openPopup.call(globalThis.chrome.action));
  }

  return browser.tabs
    .create({ url: browser.runtime.getURL('home.html') })
    .then(() => undefined);
}

function openPreferredExtensionUi({
  controller,
  sender,
}: {
  controller: Controller | undefined;
  sender: { tab?: { windowId?: number; id?: number } };
}) {
  if (shouldUseSidePanel(controller)) {
    const windowId = sender?.tab?.windowId;
    const tabId = sender?.tab?.id;
    let openOptions: { windowId: number } | { tabId: number } | null = null;
    if (typeof windowId === 'number') {
      openOptions = { windowId };
    } else if (typeof tabId === 'number') {
      openOptions = { tabId };
    }
    if (openOptions) {
      return Promise.resolve(
        globalThis.chrome.sidePanel.open(openOptions),
      ).catch(() => openPopupOrHome());
    }
  }

  return openPopupOrHome();
}

function openExtensionPage({
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
  const messageType = EXTENSION_MESSAGES.OPEN_EXTENSION;

  controller?.appStateController?.setPendingRedirectRoute?.({
    path,
    ...(search ? { search } : {}),
  });

  return openPreferredExtensionUi({ controller, sender }).then(
    () => ({
      type: messageType,
      body: { ok: true, caipAssetId },
    }),
    (error: unknown) => ({
      type: messageType,
      body: {
        ok: false,
        reason: 'open-failed',
        error: error instanceof Error ? error.message : 'unknown',
      },
    }),
  );
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
        });
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
          });
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
