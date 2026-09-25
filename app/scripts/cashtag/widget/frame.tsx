import React from 'react';
import { createRoot } from 'react-dom/client';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { AssetData, ResolvedTicker } from '../lib/types';
import { Widget } from './widget';
import { sendWidgetMessage, setWidgetAuthToken } from './widget-runtime';

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
  sendWidgetMessage(EXTENSION_MESSAGES.OPEN_EXTENSION, {
    page,
    caipAssetId: asset.caipAssetId,
  }).catch(() => undefined);
}

async function loadTicker(symbol: string): Promise<ResolvedTicker | null> {
  try {
    const response = await sendWidgetMessage(EXTENSION_MESSAGES.GET_DATA, {
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
  symbol,
  theme,
}: {
  authToken: string;
  symbol: string;
  theme: 'light' | 'dark';
}) {
  const mountPoint = document.getElementById('root');
  if (!mountPoint) {
    return;
  }
  setWidgetAuthToken(authToken);
  document.documentElement.dataset.theme = theme;

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
        sendWidgetMessage(EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED, {
          enabled: false,
        }).catch(() => undefined);
      }}
    />,
  );
}
