import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { ResolvedTicker } from './lib/types';
import { injectPills } from './pill/inject';
import { bindWidgetTriggers, injectWidget } from './widget/inject';

let cleanup: (() => void) | null = null;

async function isWidgetEnabled() {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
    });
    return response?.body?.enabled === true;
  } catch {
    return false;
  }
}

function createTickerResolver() {
  const cache = new Map<string, ResolvedTicker | null>();
  const pending = new Map<string, Promise<ResolvedTicker | null>>();

  return (symbol: string) => {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker) {
      return Promise.resolve(null);
    }

    if (cache.has(ticker)) {
      return Promise.resolve(cache.get(ticker) ?? null);
    }

    const inFlight = pending.get(ticker);
    if (inFlight !== undefined) {
      return inFlight;
    }

    const request = browser.runtime
      .sendMessage({
        type: EXTENSION_MESSAGES.GET_DATA,
        body: { symbol: ticker },
      })
      .then((response) => {
        const primary = response?.body?.asset;
        const similar = response?.body?.similar;
        if (!primary || typeof primary !== 'object') {
          cache.set(ticker, null);
          return null;
        }
        const resolved: ResolvedTicker = {
          primary,
          similar: Array.isArray(similar) ? similar : [],
        };
        cache.set(ticker, resolved);
        return resolved;
      })
      .catch(() => {
        cache.set(ticker, null);
        return null;
      })
      .finally(() => {
        pending.delete(ticker);
      });

    pending.set(ticker, request);
    return request;
  };
}

function stop() {
  cleanup?.();
  cleanup = null;
}

async function start() {
  if (cleanup) {
    return;
  }

  const resolveTicker = createTickerResolver();
  const widget = await injectWidget();
  const pills = await injectPills(async (symbol) => {
    const resolved = await resolveTicker(symbol);
    return resolved?.primary ?? null;
  });
  const triggers = bindWidgetTriggers(widget, resolveTicker);

  cleanup = () => {
    triggers.stop();
    pills.stop();
    widget.stop();
  };
}

async function setEnabled(enabled: boolean) {
  if (enabled) {
    await start();
    return;
  }
  stop();
}

browser.runtime.onMessage.addListener((message) => {
  if (message?.type !== EXTENSION_MESSAGES.X_WIDGET_ENABLED_CHANGED) {
    return undefined;
  }
  setEnabled(message.body?.enabled === true).catch(() => undefined);
  return undefined;
});

window.addEventListener('pagehide', stop);

isWidgetEnabled()
  .then((enabled) => setEnabled(enabled))
  .catch(() => undefined);
