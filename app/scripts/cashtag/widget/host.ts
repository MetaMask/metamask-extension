import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { ResolvedTicker } from '../lib/types';
import {
  bindHostColorScheme,
  injectPageStyles,
  removePageStyles,
} from '../lib/ui';

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

function frameUrl(symbol: string, theme: 'light' | 'dark') {
  const url = new URL(chrome.runtime.getURL(widgetFramePath));
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('theme', theme);
  return url.href;
}

export async function injectWidget(): Promise<WidgetHandle> {
  await injectPageStyles(
    'scripts/cashtag/widget/page.css',
    widgetPageStyleAttr,
  );

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

  const unbindColorScheme = bindHostColorScheme(host, (next) => {
    theme = next;
    if (symbol) {
      frame.src = frameUrl(symbol, theme);
    }
  });

  return {
    shadowHost: host,
    show(nextSymbol: string) {
      if (symbol === nextSymbol) {
        return;
      }
      symbol = nextSymbol;
      frame.src = frameUrl(symbol, theme);
    },
    reset() {
      symbol = null;
      frame.removeAttribute('src');
    },
    stop() {
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
