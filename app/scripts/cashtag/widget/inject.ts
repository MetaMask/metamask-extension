import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../../shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type {
  CashtagAsset,
  InterestAnchor,
  InterestEvent,
  Price,
} from '../lib/types';
import {
  createShadowRootUi,
  injectPageStyles,
  removePageStyles,
} from '../lib/ui';
import { onMount, onRemove } from './widget';

const widgetPageStyleAttr = 'data-mm-cashtag-widget-css';

type WidgetHandle = {
  shadowHost: HTMLElement;
  show: (asset: CashtagAsset) => void;
};

const anchorNameProp = 'anchor-name';
const positionAnchorProp = 'position-anchor';
const activeAnchorVar = '--mm-cashtag-invoker';

function hidePopover(host: HTMLElement) {
  if (host.matches(':popover-open')) {
    host.hidePopover();
  }
}

export async function injectWidget({
  getAssetPrice,
}: {
  getAssetPrice: (symbol: string) => Promise<Price>;
}) {
  await injectPageStyles(
    'scripts/cashtag/widget/page.css',
    widgetPageStyleAttr,
  );

  const shadowUi = await createShadowRootUi({
    name: 'mm-cashtag-popover',
    cssPath: 'scripts/cashtag/widget/widget.css',
    prepareHost(shadowHost) {
      shadowHost.setAttribute('popover', 'hint');
      shadowHost.popover = 'hint';
      shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);
    },
    onMount,
    onRemove,
  });
  shadowUi.mount();

  let activeSymbol: string | null = null;

  const render = (asset: CashtagAsset, price: Price) => {
    shadowUi.mounted?.render({
      asset,
      price,
      onSwap: () => {
        browser.runtime
          .sendMessage({ type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE })
          .catch(() => undefined);
      },
      onDisable: () => {
        window.dispatchEvent(new CustomEvent('mm-cashtag-disable'));
        hidePopover(shadowUi.shadowHost);
      },
    });
  };

  return {
    shadowHost: shadowUi.shadowHost,
    show(asset: CashtagAsset) {
      activeSymbol = asset.symbol;
      render(asset, {
        symbol: asset.symbol,
        value: null,
        percentChange: null,
      });
      getAssetPrice(asset.symbol)
        .then((price) => {
          if (activeSymbol === asset.symbol) {
            render(asset, price);
          }
        })
        .catch(() => undefined);
    },
    stop() {
      shadowUi.remove();
      removePageStyles(widgetPageStyleAttr);
    },
  };
}

export function bindWidgetTriggers(
  widget: WidgetHandle,
  assetsBySymbol: Map<string, CashtagAsset>,
) {
  const mounted = new Set<InterestAnchor>();
  const popoverId = widget.shadowHost.id;
  let lastSource: HTMLElement | null = null;

  const onInterest = (event: Event) => {
    const source = (event as InterestEvent).source;
    if (!(source instanceof HTMLAnchorElement)) {
      return;
    }

    if (lastSource && lastSource !== source) {
      lastSource.style.removeProperty(anchorNameProp);
    }
    source.style.setProperty(anchorNameProp, activeAnchorVar);
    widget.shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);
    lastSource = source;

    const asset = assetsBySymbol.get(symbolFromCashtagAnchor(source));
    if (asset) {
      widget.show(asset);
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
    for (const { element } of findCashtagAnchors(root, assetsBySymbol)) {
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
