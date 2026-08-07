import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../../shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { AssetData } from '../lib/types';
// import type { InterestAnchor, InterestEvent } from '../lib/types';
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
  show: (data: AssetData) => void;
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
    show(data: AssetData) {
      root.render(
        <Widget
          data={data}
          onSwap={() => {
            browser.runtime
              .sendMessage({
                type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
                body: { caipAssetId: data.caipAssetId },
              })
              .catch(() => undefined);
          }}
          onViewDetails={() => {
            if (!data.caipAssetId) {
              return;
            }
            browser.runtime
              .sendMessage({
                type: EXTENSION_MESSAGES.OPEN_ASSET_PAGE,
                body: { caipAssetId: data.caipAssetId },
              })
              .catch(() => undefined);
          }}
          onDisable={() => {
            browser.runtime
              .sendMessage({
                type: EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
                body: { enabled: false },
              })
              .catch(() => undefined);
            window.dispatchEvent(new CustomEvent('mm-cashtag-disable'));
            if (host.matches(':popover-open')) {
              host.hidePopover();
            }
          }}
          onFlag={() => openPortfolioExplore(data.ticker)}
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
  assetsByTicker: Map<string, AssetData>,
) {
  const mounted = new Set<HTMLAnchorElement>();
  const popoverId = widget.shadowHost.id;
  let lastSource: HTMLElement | null = null;

  // const onInterest = (event: Event) => {
  //   const { source } = event as InterestEvent;
  //   if (!(source instanceof HTMLAnchorElement)) {
  //     return;
  //   }
  //
  //   if (lastSource && lastSource !== source) {
  //     lastSource.style.removeProperty(anchorNameProp);
  //   }
  //   source.style.setProperty(anchorNameProp, activeAnchorVar);
  //   widget.shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);
  //   lastSource = source;
  //
  //   const data = assetsByTicker.get(symbolFromCashtagAnchor(source));
  //   if (data) {
  //     widget.show(data);
  //   }
  // };
  //
  // widget.shadowHost.addEventListener('interest', onInterest);

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

    const data = assetsByTicker.get(symbolFromCashtagAnchor(source));
    if (data) {
      widget.show(data);
    }
    // popovertarget on <a> is not reliably supported; showPopover is the opener.
    // Attribute still documents the invoker → #mm-cashtag-popover relationship.
    if (!widget.shadowHost.matches(':popover-open')) {
      widget.shadowHost.showPopover();
    }
  };

  const bind = (element: HTMLAnchorElement) => {
    // const interestAnchor = element as InterestAnchor;
    if (mounted.has(element)) {
      return;
    }
    // interestAnchor.setAttribute('interestfor', popoverId);
    // interestAnchor.interestForElement = widget.shadowHost;
    element.setAttribute('popovertarget', popoverId);
    element.setAttribute('popovertargetaction', 'show');
    element.addEventListener('click', onInvokerClick);
    mounted.add(element);
  };

  const scan = (root: ParentNode) => {
    for (const { element } of findCashtagAnchors(root, assetsByTicker)) {
      bind(element);
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
      // invoker.removeAttribute('interestfor');
      // invoker.interestForElement = null;
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
      // widget.shadowHost.removeEventListener('interest', onInterest);
      for (const invoker of mounted) {
        invoker.style.removeProperty(anchorNameProp);
        // invoker.removeAttribute('interestfor');
        // invoker.interestForElement = null;
        invoker.removeAttribute('popovertarget');
        invoker.removeAttribute('popovertargetaction');
        invoker.removeEventListener('click', onInvokerClick);
      }
      mounted.clear();
      lastSource = null;
    },
  };
}
