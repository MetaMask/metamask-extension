import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { AssetData, ResolvedTicker } from './lib/types';
import { injectPills } from './pill/inject';
import { bindWidgetTriggers, injectWidget } from './widget/host';

const xHosts = new Set(['x.com', 'www.x.com']);

let cleanup: (() => void) | null = null;
let initialized = false;

function sendRuntimeMessage(message: Record<string, unknown>) {
  const response = chrome.runtime.sendMessage(message);
  if (response && typeof response.then === 'function') {
    return response;
  }

  return new Promise<unknown>((resolve, reject) =>
    chrome.runtime.sendMessage(message, (callbackResponse) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
        return;
      }
      resolve(callbackResponse);
    }),
  );
}

async function isWidgetEnabled() {
  try {
    const response = (await sendRuntimeMessage({
      type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
    })) as { body?: { enabled?: boolean } } | undefined;
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

    const request = sendRuntimeMessage({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: { symbol: ticker },
    })
      .then((response) => {
        const typedResponse = response as
          | { body?: { asset?: AssetData; similar?: unknown } }
          | undefined;
        const primary = typedResponse?.body?.asset;
        const similar = typedResponse?.body?.similar;
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

function onDomReady() {
  if (document.readyState !== 'loading') {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), {
      once: true,
    });
  });
}

export function initCashtag() {
  // Runs inside contentscript.js, which is injected into every frame at
  // document_start; the widget only belongs in the top frame of X.
  if (window.top !== window.self || !xHosts.has(window.location.hostname)) {
    return;
  }

  onDomReady()
    .then(() => {
      if (initialized) {
        return undefined;
      }
      initialized = true;

      chrome.runtime.onMessage.addListener((message) => {
        if (message?.type !== EXTENSION_MESSAGES.X_WIDGET_ENABLED_CHANGED) {
          return undefined;
        }
        setEnabled(message.body?.enabled === true).catch(() => undefined);
        return undefined;
      });

      window.addEventListener('pagehide', stop);

      return isWidgetEnabled().then((enabled) => setEnabled(enabled));
    })
    .catch(() => undefined);
}
