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

async function isWidgetEnabled() {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
    });
    // Default to enabled unless the preference is explicitly turned off.
    return response?.body?.enabled !== false;
  } catch {
    return true;
  }
}

async function main() {
  if (!(await isWidgetEnabled())) {
    return;
  }

  const host = window.location.hostname.toLowerCase();
  if (!supportedHosts.has(host)) {
    return;
  }

  const assets = await getAssetData();
  const assetsByTicker = new Map(assets.map((asset) => [asset.ticker, asset]));
  if (assetsByTicker.size === 0) {
    return;
  }

  // Inject the widget first: its page.css defines the shared palette tokens on
  // <html>, which the pills also consume, so they must exist before pills paint.
  const widget = await injectWidget();
  const pills = await injectPills(assetsByTicker);
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
