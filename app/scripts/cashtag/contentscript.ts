import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { createTickerResolver } from './lib/ticker-resolver';
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

function stop() {
  cleanup?.();
  cleanup = null;
}

async function start() {
  if (cleanup) {
    return;
  }

  const resolveTicker = createTickerResolver(sendRuntimeMessage);
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

async function initializeCashtag() {
  await onDomReady();
  if (initialized) {
    return;
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

  const enabled = await isWidgetEnabled();
  await setEnabled(enabled);
}

export function initCashtag() {
  // Runs inside contentscript.js, which is injected into every frame at
  // document_start. The background bridge enables only frame 0.
  if (!xHosts.has(window.location.hostname)) {
    return;
  }

  initializeCashtag().catch(() => undefined);
}
