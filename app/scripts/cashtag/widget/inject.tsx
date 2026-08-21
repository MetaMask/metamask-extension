import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { AssetData, ResolvedTicker } from '../lib/types';
import {
  bindHostColorScheme,
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

  const host = document.createElement('div');
  host.id = 'mm-cashtag-popover';
  host.setAttribute('popover', 'auto');
  host.popover = 'auto';
  host.style.setProperty(positionAnchorProp, activeAnchorVar);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  const widgetCss = await loadCss('scripts/cashtag/widget/widget.css');
  if (widgetCss) {
    const style = document.createElement('style');
    style.textContent = scopeDesignTokensForShadow(widgetCss);
    shadowRoot.appendChild(style);
  }

  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  document.documentElement.appendChild(host);

  const unbindColorScheme = bindHostColorScheme(host);
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
        />,
      );
    },
    stop() {
      unbindColorScheme();
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

  // interestfor shows/hides the popover. We only fill content when it opens.
  const onBeforeToggle = (event: Event) => {
    const toggle = event as ToggleEvent;
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

    resolveTicker(symbolFromCashtagAnchor(source))
      .then((resolved) => {
        if (!resolved || !source.isConnected || lastSource !== source) {
          return;
        }
        widget.show(resolved);
      })
      .catch(() => undefined);
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
