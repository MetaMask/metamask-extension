import { findCashtagAnchors, formatUsd } from '../lib/helpers';
import type { AssetData } from '../lib/types';
import { injectPageStyles, removePageStyles } from '../lib/ui';

function buildPillContents(data: AssetData) {
  const icon = document.createElement('img');
  icon.className = 'mm-cashtag-pill-icon';
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  if (data.color) {
    icon.style.background = data.color;
  }
  if (data.iconUrl) {
    icon.src = data.iconUrl;
  }

  const ticker = document.createElement('span');
  ticker.className = 'mm-cashtag-pill-ticker';
  ticker.textContent = data.ticker;

  const priceEl = document.createElement('span');
  priceEl.className = 'mm-cashtag-pill-price';
  if (data.price !== null) {
    priceEl.textContent = formatUsd(data.price);
  }

  const label = document.createElement('span');
  label.className = 'mm-cashtag-pill-label';
  label.append(ticker, priceEl);

  const fragment = document.createDocumentFragment();
  fragment.append(icon, label);
  return fragment;
}

export async function injectPills(assetsByTicker: Map<string, AssetData>) {
  await injectPageStyles(
    'scripts/cashtag/pill/styles.css',
    'data-mm-cashtag-pill-css',
  );

  const painted = new WeakSet<HTMLAnchorElement>();

  const paint = (element: HTMLAnchorElement, data: AssetData) => {
    if (painted.has(element) || element.dataset.mmCashtag) {
      return;
    }
    painted.add(element);
    element.dataset.mmCashtag = data.ticker;
    element.replaceChildren();
    element.append(buildPillContents(data));
  };

  // Drop pill markup and reinstate the plain `$TICKER` cashtag text, then
  // remove the `data-mm-cashtag` hook that the injected styles key off.
  const unpaint = (element: HTMLAnchorElement) => {
    element.replaceChildren(`$${element.dataset.mmCashtag ?? ''}`);
    delete element.dataset.mmCashtag;
    painted.delete(element);
  };

  const scan = (root: ParentNode) => {
    for (const { element, asset } of findCashtagAnchors(root, assetsByTicker)) {
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
      for (const element of document.querySelectorAll<HTMLAnchorElement>(
        '[data-mm-cashtag]',
      )) {
        unpaint(element);
      }
    },
  };
}
