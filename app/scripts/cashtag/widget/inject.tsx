import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../../shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { AssetData, ResolvedTicker } from '../lib/types';
import {
  injectPageStyles,
  loadCss,
  removePageStyles,
  scopeDesignTokensForShadow,
} from '../lib/ui';
import { Widget } from './widget';

const widgetPageStyleAttr = 'data-mm-cashtag-widget-css';
const anchorNameProp = 'anchor-name';
const positionAnchorProp = 'position-anchor';
const activeAnchorVar = '--cashtag-invoker';

type WidgetHandle = {
  shadowHost: HTMLElement;
  show: (resolved: ResolvedTicker) => void;
  stop: () => void;
};

function applyWidgetTheme(host: HTMLElement) {
  const page = document.documentElement;
  const isLight =
    page.classList.contains('light') ||
    page.getAttribute('data-theme') === 'light' ||
    page.getAttribute('data-color-mode') === 'light';
  host.dataset.theme = isLight ? 'light' : 'dark';
}

function openPortfolioExplore(ticker: string) {
  window.open(
    `https://portfolio.metamask.io/explore/tokens?search=${encodeURIComponent(ticker)}`,
    '_blank',
    'noopener,noreferrer',
  );
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

export async function injectWidget() {
  await injectPageStyles(
    'scripts/cashtag/widget/page.css',
    widgetPageStyleAttr,
  );

  // Single page-level widget host. Cashtag anchors target this id via popovertarget.
  const host = document.createElement('div');
  host.id = 'mm-cashtag-popover';
  host.setAttribute('popover', 'auto');
  host.popover = 'auto';
  host.style.setProperty(positionAnchorProp, activeAnchorVar);
  applyWidgetTheme(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Fetch built CSS (not import): HtmlBundler strips CSS imported from JS to
  // an empty module, which broke shadow styles and aborted injectWidget().
  const widgetCss = await loadCss('scripts/cashtag/widget/widget.css');
  if (widgetCss) {
    const style = document.createElement('style');
    style.textContent = scopeDesignTokensForShadow(widgetCss);
    shadowRoot.appendChild(style);
  }

  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  document.documentElement.appendChild(host);
  const root = createRoot(mountPoint);

  return {
    shadowHost: host,
    show(resolved: ResolvedTicker) {
      root.render(
        <Widget
          data={resolved.primary}
          similar={resolved.similar}
          onSwap={(asset) => openExtensionPage('swap', asset)}
          onViewDetails={(asset) => openExtensionPage('asset', asset)}
          onDisable={() => {
            if (host.matches(':popover-open')) {
              host.hidePopover();
            }
            browser.runtime
              .sendMessage({
                type: EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
                body: { enabled: false },
              })
              .catch(() => undefined);
          }}
          onFlag={() => openPortfolioExplore(resolved.primary.ticker)}
        />,
      );
    },
    stop() {
      root.unmount();
      host.remove();
      removePageStyles(widgetPageStyleAttr);
    },
  } satisfies WidgetHandle;
}

export function bindWidgetTriggers(
  widget: WidgetHandle,
  resolveTicker: (symbol: string) => Promise<ResolvedTicker | null>,
) {
  const mounted = new Set<HTMLAnchorElement>();
  const resolving = new WeakSet<HTMLAnchorElement>();
  const popoverId = widget.shadowHost.id;
  let lastSource: HTMLElement | null = null;

  const onInvokerClick = (event: MouseEvent) => {
    const source = event.currentTarget;
    if (!(source instanceof HTMLAnchorElement)) {
      return;
    }

    // Keep the X cashtag navigation from firing while opening the widget.
    event.preventDefault();
    event.stopPropagation();

    if (lastSource && lastSource !== source) {
      lastSource.style.removeProperty(anchorNameProp);
    }
    source.style.setProperty(anchorNameProp, activeAnchorVar);
    widget.shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);
    lastSource = source;

    resolveTicker(symbolFromCashtagAnchor(source))
      .then((resolved) => {
        if (!resolved) {
          return;
        }
        widget.show(resolved);
        if (!widget.shadowHost.matches(':popover-open')) {
          widget.shadowHost.showPopover();
        }
      })
      .catch(() => undefined);
  };

  const bind = (element: HTMLAnchorElement) => {
    if (mounted.has(element)) {
      return;
    }
    element.setAttribute('popovertarget', popoverId);
    element.setAttribute('popovertargetaction', 'show');
    element.addEventListener('click', onInvokerClick);
    mounted.add(element);
  };

  const scan = (root: ParentNode) => {
    for (const { element, symbol } of findCashtagAnchors(root)) {
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
      invoker.removeAttribute('popovertarget');
      invoker.removeAttribute('popovertargetaction');
      invoker.removeEventListener('click', onInvokerClick);
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
      for (const invoker of mounted) {
        invoker.style.removeProperty(anchorNameProp);
        invoker.removeAttribute('popovertarget');
        invoker.removeAttribute('popovertargetaction');
        invoker.removeEventListener('click', onInvokerClick);
      }
      mounted.clear();
      lastSource = null;
    },
  };
}
