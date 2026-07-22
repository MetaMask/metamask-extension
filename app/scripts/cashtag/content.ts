import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { featureFlag, supportedHosts } from './lib/constants';
import type { CashtagAsset, Price } from './lib/types';
import { injectPills } from './pill/inject';
import { bindWidgetTriggers, injectWidget } from './widget/inject';

async function getAssetWhitelist() {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_ASSET_WHITELIST,
    });
    const assets = response?.body?.assets;
    return Array.isArray(assets) ? (assets as CashtagAsset[]) : [];
  } catch {
    return [];
  }
}

async function getAssetPrice(symbol: string): Promise<Price> {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_ASSET_PRICE,
      body: { symbol },
    });
    return {
      symbol,
      value:
        typeof response?.body?.value === 'number' ? response.body.value : null,
      percentChange:
        typeof response?.body?.percentChange === 'number'
          ? response.body.percentChange
          : null,
    };
  } catch {
    return { symbol, value: null, percentChange: null };
  }
}

async function getFeatureFlag(): Promise<boolean | null> {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG,
      body: { flagName: featureFlag },
    });
    if (typeof response?.body?.enabled === 'boolean') {
      return response.body.enabled;
    }
    return null;
  } catch {
    return null;
  }
}

function waitForReady(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    let timer = 0;
    const onMessage = (msg: { name?: string }) => {
      if (msg?.name === EXTENSION_MESSAGES.READY) {
        clearTimeout(timer);
        browser.runtime.onMessage.removeListener(onMessage);
        resolve();
      }
      return undefined;
    };
    timer = setTimeout(() => {
      browser.runtime.onMessage.removeListener(onMessage);
      resolve();
    }, timeoutMs);
    browser.runtime.onMessage.addListener(onMessage);
  });
}

async function main() {
  const host = window.location.hostname.toLowerCase();
  if (!supportedHosts.has(host)) {
    return;
  }

  let enabled = await getFeatureFlag();
  if (enabled === null) {
    await waitForReady(5000);
    enabled = (await getFeatureFlag()) ?? false;
  }
  if (!enabled) {
    return;
  }

  const assets = await getAssetWhitelist();
  const assetsBySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
  if (assetsBySymbol.size === 0) {
    return;
  }

  const pills = await injectPills(assetsBySymbol, { getAssetPrice });
  const widget = await injectWidget({ getAssetPrice });
  const triggers = bindWidgetTriggers(widget, assetsBySymbol);

  const teardown = () => {
    triggers.stop();
    pills.stop();
    widget.stop();
  };

  window.addEventListener('mm-cashtag-disable', teardown);
  window.addEventListener('pagehide', teardown);
}

main().catch(() => undefined);
