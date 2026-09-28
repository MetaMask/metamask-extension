import React from 'react';
import { createRoot } from 'react-dom/client';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  sendWidgetAction,
  setWidgetSession,
} from '../../widgets/frame-runtime';
import { onWidgetUpdate } from '../../widgets/frame-updates';
import { WIDGETS } from '../../widgets/protocol';
import type { AssetData, ResolvedTicker } from '../lib/types';
import { isCashtagTheme, isCashtagThemeUpdate } from './theme';
import { Widget } from './widget';

// The widget CSS is loaded at runtime because HtmlBundler leaves the
// design-tokens package import unresolved in distributed CSS. The copied
// stylesheet below is preprocessed with the tokens inlined.
function loadStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('scripts/cashtag/widget/widget.css');
  document.head.appendChild(link);
  return new Promise<void>((resolve) => {
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => resolve());
  });
}

function openExtensionPage(page: 'swap' | 'asset', asset: AssetData) {
  if (!asset.caipAssetId) {
    return;
  }
  sendWidgetAction(EXTENSION_MESSAGES.OPEN_EXTENSION, {
    page,
    caipAssetId: asset.caipAssetId,
  }).catch(() => undefined);
}

async function loadTicker(symbol: string): Promise<ResolvedTicker | null> {
  try {
    const response = await sendWidgetAction(EXTENSION_MESSAGES.GET_DATA, {
      symbol,
    });
    const result = response as
      | { body?: { asset?: AssetData; similar?: AssetData[] } }
      | undefined;
    const primary = result?.body?.asset;
    const similar = result?.body?.similar;
    if (!primary || typeof primary !== 'object') {
      return null;
    }
    return {
      primary,
      similar: Array.isArray(similar) ? similar : [],
    };
  } catch {
    return null;
  }
}

export async function mountFrame({
  authToken,
  payload,
}: {
  authToken: string;
  payload: unknown;
}) {
  const symbol =
    payload && typeof payload === 'object' && 'symbol' in payload
      ? payload.symbol
      : undefined;
  const theme =
    payload && typeof payload === 'object' && 'theme' in payload
      ? payload.theme
      : undefined;
  if (
    typeof symbol !== 'string' ||
    symbol.length === 0 ||
    symbol.length > 32 ||
    !isCashtagTheme(theme)
  ) {
    return;
  }
  const mountPoint = document.getElementById('root');
  if (!mountPoint) {
    return;
  }
  setWidgetSession(WIDGETS.Cashtag.id, authToken);
  document.documentElement.dataset.theme = theme;
  onWidgetUpdate((update) => {
    if (isCashtagThemeUpdate(update)) {
      document.documentElement.dataset.theme = update.theme;
    }
  });

  await loadStyles();
  const resolved = await loadTicker(symbol);
  if (!resolved) {
    return;
  }

  createRoot(mountPoint).render(
    <Widget
      data={resolved.primary}
      similar={resolved.similar}
      onSwap={(asset) => openExtensionPage('swap', asset)}
      onViewDetails={(asset) => openExtensionPage('asset', asset)}
      onDisable={() => {
        sendWidgetAction(EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED, {
          enabled: false,
        }).catch(() => undefined);
      }}
    />,
  );
}
