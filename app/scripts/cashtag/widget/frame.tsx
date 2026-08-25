import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { AssetData, ResolvedTicker } from '../lib/types';
import { Widget } from './widget';

function loadStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = browser.runtime.getURL('scripts/cashtag/widget/widget.css');
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
  browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.OPEN_EXTENSION,
      body: { page, caipAssetId: asset.caipAssetId },
    })
    .catch(() => undefined);
}

async function loadTicker(symbol: string): Promise<ResolvedTicker | null> {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: { symbol },
    });
    const primary = response?.body?.asset;
    const similar = response?.body?.similar;
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

async function main() {
  const mountPoint = document.getElementById('root');
  if (!mountPoint) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const symbol = params.get('symbol')?.trim();
  const theme = params.get('theme');
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.dataset.theme = theme;
  }
  if (!symbol) {
    return;
  }

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
        browser.runtime
          .sendMessage({
            type: EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
            body: { enabled: false },
          })
          .catch(() => undefined);
      }}
    />,
  );
}

main().catch(() => undefined);
