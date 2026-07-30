import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../../shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { AssetData, InterestAnchor, InterestEvent } from '../lib/types';
import { injectPageStyles, loadCss, removePageStyles } from '../lib/ui';
import { Widget } from './widget';

const widgetPageStyleAttr = 'data-mm-cashtag-widget-css';
const anchorNameProp = 'anchor-name';
const positionAnchorProp = 'position-anchor';
const activeAnchorVar = '--mm-cashtag-invoker';

type WidgetHandle = {
  shadowHost: HTMLElement;
  show: (data: AssetData) => void;
  stop: () => void;
};

export async function injectWidget() {
  // Page CSS lives outside the shadow root (popover positioning + shared theme).
  await injectPageStyles(
    'scripts/cashtag/widget/page.css',
    widgetPageStyleAttr,
  );

  const host = document.createElement('div');
  host.id = 'mm-cashtag-popover';
  host.setAttribute('popover', 'hint');
  host.popover = 'hint';
  host.style.setProperty(positionAnchorProp, activeAnchorVar);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = (
    await loadCss('scripts/cashtag/widget/widget.css')
  ).replaceAll(':root', ':host');
  shadowRoot.appendChild(style);

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
  const mounted = new Set<InterestAnchor>();
  const popoverId = widget.shadowHost.id;
  let lastSource: HTMLElement | null = null;

  const onInterest = (event: Event) => {
    const { source } = event as InterestEvent;
    if (!(source instanceof HTMLAnchorElement)) {
      return;
    }

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
  };

  widget.shadowHost.addEventListener('interest', onInterest);

  const bind = (element: HTMLAnchorElement) => {
    const interestAnchor = element as InterestAnchor;
    if (mounted.has(interestAnchor)) {
      return;
    }
    interestAnchor.setAttribute('interestfor', popoverId);
    interestAnchor.interestForElement = widget.shadowHost;
    mounted.add(interestAnchor);
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
      invoker.removeAttribute('interestfor');
      invoker.interestForElement = null;
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
      widget.shadowHost.removeEventListener('interest', onInterest);
      for (const invoker of mounted) {
        invoker.style.removeProperty(anchorNameProp);
        invoker.removeAttribute('interestfor');
        invoker.interestForElement = null;
      }
      mounted.clear();
      lastSource = null;
    },
  };
}
