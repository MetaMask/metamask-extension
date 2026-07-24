import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { supportedHosts } from './lib/constants';
import type { AssetData } from './lib/types';
import { injectPills } from './pill/inject';
import { bindWidgetTriggers, injectWidget } from './widget/inject';

async function getAssetData() {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_ASSET_DATA,
    });
    const assets = response?.body?.assets;
    return Array.isArray(assets) ? (assets as AssetData[]) : [];
  } catch {
    return [];
  }
}

async function main() {
  const host = window.location.hostname.toLowerCase();
  if (!supportedHosts.has(host)) {
    return;
  }

  const assets = await getAssetData();
  const assetsByTicker = new Map(assets.map((asset) => [asset.ticker, asset]));
  if (assetsByTicker.size === 0) {
    return;
  }

  const pills = await injectPills(assetsByTicker);
  const widget = await injectWidget();
  const triggers = bindWidgetTriggers(widget, assetsByTicker);

  const teardown = () => {
    triggers.stop();
    pills.stop();
    widget.stop();
  };

  window.addEventListener('mm-cashtag-disable', teardown);
  window.addEventListener('pagehide', teardown);
}

main().catch(() => undefined);
