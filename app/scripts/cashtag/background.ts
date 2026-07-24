import browser from 'webextension-polyfill';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { fetchAssetData } from './lib/assets';
import { swapRoute, swapRouteSearchForDest } from './lib/constants';
import type { Controller } from './lib/types';

let registered = false;

function bodyString(message: { body?: Record<string, unknown> }, key: string) {
  const value = message.body?.[key];
  return typeof value === 'string' ? value : null;
}

export function registerBackgroundBridge({
  getController,
}: {
  getController: () => Controller | undefined;
}) {
  if (registered) {
    return;
  }
  registered = true;

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG) {
      const flagName = bodyString(message, 'flagName');
      if (!flagName) {
        return undefined;
      }
      const controller = getController();
      const flags = {
        ...(controller?.remoteFeatureFlagController?.state
          ?.remoteFeatureFlags ?? {}),
        ...(getManifestFlags().remoteFeatureFlags ?? {}),
      };
      return Promise.resolve({
        type: EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG,
        body: {
          flagName,
          enabled: getBooleanFeatureFlag(flags[flagName], false),
        },
      });
    }

    if (message?.type === EXTENSION_MESSAGES.GET_ASSET_DATA) {
      return fetchAssetData()
        .then((assets) => ({
          type: EXTENSION_MESSAGES.GET_ASSET_DATA,
          body: { assets },
        }))
        .catch(() => ({
          type: EXTENSION_MESSAGES.GET_ASSET_DATA,
          body: { assets: [] },
        }));
    }

    if (message?.type === EXTENSION_MESSAGES.OPEN_SWAP_PAGE) {
      const controller = getController();
      const windowId = sender?.tab?.windowId;
      const tabId = sender?.tab?.id;
      const sidePanelApi = globalThis.chrome?.sidePanel;
      const caipAssetId = bodyString(message, 'caipAssetId');

      if (!sidePanelApi?.open) {
        return Promise.resolve({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: { ok: false, reason: 'sidepanel-unavailable' },
        });
      }

      let openOptions: { windowId: number } | { tabId: number } | null = null;
      if (typeof windowId === 'number') {
        openOptions = { windowId };
      } else if (typeof tabId === 'number') {
        openOptions = { tabId };
      }

      if (!openOptions) {
        return Promise.resolve({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: { ok: false, reason: 'sidepanel-unavailable' },
        });
      }

      controller?.appStateController?.setPendingRedirectRoute?.({
        path: swapRoute,
        ...(caipAssetId ? { search: swapRouteSearchForDest(caipAssetId) } : {}),
        environmentType: ENVIRONMENT_TYPE_SIDEPANEL,
      });

      return Promise.resolve(sidePanelApi.open(openOptions)).then(
        () => ({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: { ok: true, caipAssetId },
        }),
        (error: unknown) => ({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: {
            ok: false,
            reason: 'sidepanel-open-failed',
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      );
    }

    return undefined;
  });
}
