import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { ResolvedTicker } from '../lib/types';
import {
  bindHostColorScheme,
  injectPageStyles,
  removePageStyles,
} from '../lib/ui';
import widgetPageStyles from './page.css';

const widgetPageStyleAttr = 'data-mm-cashtag-widget-css';
const widgetFramePath = 'cashtag-widget.html';
const anchorNameProp = 'anchor-name';
const positionAnchorProp = 'position-anchor';
const activeAnchorVar = '--cashtag-invoker';
const frameWidth = 576;
const frameHeight = 503;

export type WidgetHandle = {
  shadowHost: HTMLElement;
  show: (symbol: string) => void;
  reset: () => void;
  stop: () => void;
};

type WidgetInitMessage = {
  type: 'METAMASK_X_WIDGET_INIT';
  authToken: string;
  symbol: string;
  theme: 'light' | 'dark';
};

function newAuthToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function registerFrame(authToken: string) {
  try {
    const response = (await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.REGISTER_X_WIDGET_FRAME,
      body: { authToken },
    })) as { body?: { ok?: boolean } } | undefined;
    return response?.body?.ok === true;
  } catch {
    return false;
  }
}

function revokeFrame(authToken: string | null) {
  if (!authToken) {
    return;
  }
  browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.REVOKE_X_WIDGET_FRAME,
      body: { authToken },
    })
    .catch(() => undefined);
}

export async function injectWidget(): Promise<WidgetHandle> {
  const frameUrl = chrome.runtime.getURL(widgetFramePath);
  const frameUrlParts = new URL(frameUrl);
  const frameOrigin = `${frameUrlParts.protocol}//${frameUrlParts.host}`;
  injectPageStyles(widgetPageStyles, widgetPageStyleAttr);

  const host = document.createElement('div');
  host.id = 'mm-cashtag-popover';
  host.setAttribute('popover', 'auto');
  host.popover = 'auto';
  host.style.setProperty(positionAnchorProp, activeAnchorVar);
  host.style.width = `${frameWidth}px`;
  host.style.height = `${frameHeight}px`;

  const shadowRoot = host.attachShadow({ mode: 'closed' });

  const frame = document.createElement('iframe');
  frame.setAttribute('title', 'MetaMask');
  frame.style.cssText =
    'display:block;width:100%;height:100%;border:0;color-scheme:normal;background:transparent;';
  shadowRoot.appendChild(frame);

  document.documentElement.appendChild(host);

  let theme: 'light' | 'dark' = 'light';
  let symbol: string | null = null;
  let authToken: string | null = null;
  let generation = 0;
  let registrationQueue = Promise.resolve();

  const onFrameLoad = () => {
    if (!authToken || !symbol) {
      return;
    }
    const message: WidgetInitMessage = {
      type: 'METAMASK_X_WIDGET_INIT',
      authToken,
      symbol,
      theme,
    };
    frame.contentWindow?.postMessage(message, frameOrigin);
  };
  frame.addEventListener('load', onFrameLoad);

  const unbindColorScheme = bindHostColorScheme(host, (next) => {
    theme = next;
    if (authToken) {
      frame.contentWindow?.postMessage(
        { type: 'METAMASK_X_WIDGET_THEME', authToken, theme },
        frameOrigin,
      );
    }
  });

  function reset() {
    generation += 1;
    const oldToken = authToken;
    authToken = null;
    symbol = null;
    frame.removeAttribute('src');
    revokeFrame(oldToken);
  }

  return {
    shadowHost: host,
    show(nextSymbol: string) {
      if (symbol === nextSymbol) {
        return;
      }
      reset();
      symbol = nextSymbol;
      const requestGeneration = generation;
      const nextToken = newAuthToken();
      authToken = nextToken;
      const registration = registrationQueue.then(() =>
        registerFrame(nextToken),
      );
      registrationQueue = registration.then(() => undefined);
      registration.then((ok) => {
        if (!ok || generation !== requestGeneration) {
          return;
        }
        frame.src = frameUrl;
      });
    },
    reset,
    stop() {
      reset();
      frame.removeEventListener('load', onFrameLoad);
      unbindColorScheme();
      host.remove();
      removePageStyles(widgetPageStyleAttr);
    },
  };
}

export function bindWidgetTriggers(
  widget: WidgetHandle,
  resolveTicker: (symbol: string) => Promise<ResolvedTicker | null>,
) {
  const mounted = new Set<HTMLAnchorElement>();
  const resolving = new WeakSet<HTMLAnchorElement>();
  const popoverId = widget.shadowHost.id;
  let lastSource: HTMLElement | null = null;

  // interestfor shows/hides the popover. We only fill content when it opens.
  const onBeforeToggle = (event: Event) => {
    const toggle = event as ToggleEvent;
    if (toggle.newState === 'closed') {
      widget.reset();
      return;
    }
    if (toggle.newState !== 'open') {
      return;
    }

    const source = document.querySelector<HTMLAnchorElement>(
      `a[interestfor="${popoverId}"]:interest-source`,
    );
    if (!source) {
      return;
    }

    if (lastSource && lastSource !== source) {
      lastSource.style.removeProperty(anchorNameProp);
    }
    source.style.setProperty(anchorNameProp, activeAnchorVar);
    widget.shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);
    lastSource = source;

    widget.show(symbolFromCashtagAnchor(source));
  };

  widget.shadowHost.addEventListener('beforetoggle', onBeforeToggle);

  const bind = (element: HTMLAnchorElement) => {
    if (mounted.has(element)) {
      return;
    }
    element.setAttribute('interestfor', popoverId);
    mounted.add(element);
  };

  const scan = (root: ParentNode) => {
    const anchors = findCashtagAnchors(root);
    for (const { element, symbol } of anchors) {
      if (mounted.has(element) || resolving.has(element)) {
        continue;
      }
      resolving.add(element);
      resolveTicker(symbol)
        .then((resolved) => {
          if (!element.isConnected || !resolved) {
            return;
          }
          bind(element);
        })
        .finally(() => {
          resolving.delete(element);
        });
    }
  };

  const prune = () => {
    for (const invoker of mounted) {
      if (invoker.isConnected) {
        continue;
      }
      if (lastSource === invoker) {
        lastSource = null;
      }
      invoker.style.removeProperty(anchorNameProp);
      invoker.removeAttribute('interestfor');
      mounted.delete(invoker);
    }
  };

  scan(document);

  const observer = new MutationObserver((mutations) => {
    let removed = false;
    for (const mutation of mutations) {
      if (mutation.removedNodes.length) {
        removed = true;
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scan(node as Element);
        }
      }
    }
    if (removed) {
      prune();
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return {
    stop() {
      observer.disconnect();
      widget.shadowHost.removeEventListener('beforetoggle', onBeforeToggle);
      for (const invoker of mounted) {
        invoker.style.removeProperty(anchorNameProp);
        invoker.removeAttribute('interestfor');
      }
      mounted.clear();
      lastSource = null;
    },
  };
}
