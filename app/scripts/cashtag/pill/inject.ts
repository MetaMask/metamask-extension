import { findCashtagAnchors, formatUsd } from '../lib/helpers';
import type { CashtagAsset, Price } from '../lib/types';
import { injectPageStyles, removePageStyles } from '../lib/ui';

function buildPillContents(asset: CashtagAsset) {
  const icon = document.createElement('span');
  icon.className = 'mm-cashtag-pill-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.background = asset.color;
  icon.textContent = asset.icon;

  const ticker = document.createElement('span');
  ticker.className = 'mm-cashtag-pill-ticker';
  ticker.textContent = asset.symbol;

  const priceEl = document.createElement('span');
  priceEl.className = 'mm-cashtag-pill-price';
  priceEl.dataset.price = '';

  const label = document.createElement('span');
  label.className = 'mm-cashtag-pill-label';
  label.append(ticker, priceEl);

  const fragment = document.createDocumentFragment();
  fragment.append(icon, label);
  return { fragment, priceEl };
}

export async function injectPills(
  assetsBySymbol: Map<string, CashtagAsset>,
  {
    getAssetPrice,
  }: {
    getAssetPrice: (symbol: string) => Promise<Price>;
  },
) {
  await injectPageStyles(
    'scripts/cashtag/pill/styles.css',
    'data-mm-cashtag-pill-css',
  );

  const painted = new WeakSet<HTMLAnchorElement>();

  const paint = (element: HTMLAnchorElement, asset: CashtagAsset) => {
    if (painted.has(element) || element.dataset.mmCashtag) {
      return;
    }
    painted.add(element);
    element.dataset.mmCashtag = asset.symbol;
    element.replaceChildren();
    const { fragment, priceEl } = buildPillContents(asset);
    element.append(fragment);

    getAssetPrice(asset.symbol)
      .then((quote) => {
        if (!element.isConnected) {
          return;
        }
        priceEl.textContent =
          quote.value === null ? '' : formatUsd(quote.value);
      })
      .catch(() => undefined);
  };

  const scan = (root: ParentNode) => {
    for (const { element, asset } of findCashtagAnchors(root, assetsBySymbol)) {
      paint(element, asset);
    }
  };

  scan(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scan(node as Element);
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return {
    stop() {
      observer.disconnect();
      removePageStyles('data-mm-cashtag-pill-css');
    },
  };
}
