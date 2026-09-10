import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { createTickerResolver } from './lib/ticker-resolver';
import { injectPills } from './pill/inject';
import { bindWidgetTriggers, injectWidget } from './widget/host';

const xHosts = new Set(['x.com', 'www.x.com']);

let initialized = false;

type WidgetDeps = {
  injectWidget: typeof injectWidget;
  injectPills: typeof injectPills;
  bindWidgetTriggers: typeof bindWidgetTriggers;
  createTickerResolver: typeof createTickerResolver;
  sendRuntimeMessage: (message: Record<string, unknown>) => Promise<unknown>;
};

export function createWidgetLifecycle(deps: WidgetDeps) {
  let cleanup: (() => void) | null = null;
  let enabled = false;
  // Enable and disable overlap, because the background broadcast can land
  // while the initial enabled state is still being fetched. Each request waits
  // for the previous one, so a mount is never duplicated and a disable is
  // never dropped while a mount is still injecting.
  let queue = Promise.resolve();

  async function mount() {
    const resolveTicker = deps.createTickerResolver(deps.sendRuntimeMessage);
    const widget = await deps.injectWidget();
    if (!enabled) {
      widget.stop();
      return;
    }

    const pills = await deps.injectPills(async (symbol) => {
      const resolved = await resolveTicker(symbol);
      return resolved?.primary ?? null;
    });
    const triggers = deps.bindWidgetTriggers(widget, resolveTicker);
    const stopAll = () => {
      triggers.stop();
      pills.stop();
      widget.stop();
    };

    if (!enabled) {
      stopAll();
      return;
    }
    cleanup = stopAll;
  }

  function unmount() {
    cleanup?.();
    cleanup = null;
  }

  // Bring the widget in line with the latest requested state.
  async function sync() {
    if (enabled && !cleanup) {
      await mount();
      return;
    }
    if (!enabled && cleanup) {
      unmount();
    }
  }

  function setEnabled(next: boolean) {
    enabled = next;
    queue = queue.catch(() => undefined).then(sync);
    return queue;
  }

  // pagehide cannot await, so tear down synchronously. An in-flight mount sees
  // the flag and discards whatever it injected.
  function stop() {
    enabled = false;
    unmount();
  }

  return { setEnabled, stop };
}

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

export function attachPageVisibility(
  lifecycle: {
    setEnabled: (enabled: boolean) => Promise<void>;
    stop: () => void;
  },
  isEnabled: () => Promise<boolean>,
) {
  window.addEventListener('pagehide', lifecycle.stop);
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      return;
    }
    isEnabled()
      .then((enabled) => lifecycle.setEnabled(enabled))
      .catch(() => undefined);
  });
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

  const lifecycle = createWidgetLifecycle({
    injectWidget,
    injectPills,
    bindWidgetTriggers,
    createTickerResolver,
    sendRuntimeMessage,
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== EXTENSION_MESSAGES.X_WIDGET_ENABLED_CHANGED) {
      return undefined;
    }
    lifecycle.setEnabled(message.body?.enabled === true).catch(() => undefined);
    return undefined;
  });

  attachPageVisibility(lifecycle, isWidgetEnabled);

  const enabled = await isWidgetEnabled();
  await lifecycle.setEnabled(enabled);
}

export function initCashtag() {
  // Runs inside contentscript.js, which is injected into every frame at
  // document_start. The background bridge enables only frame 0.
  if (!xHosts.has(window.location.hostname)) {
    return;
  }

  initializeCashtag().catch(() => undefined);
}
