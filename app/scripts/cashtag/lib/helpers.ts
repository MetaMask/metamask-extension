import type { AssetData } from './types';

// X cashtag links look like:
// <a href="/search?q=%24BTC&src=cashtag_click">$BTC</a>
const cashtagAnchorSelector =
  'a[href*="src=cashtag_click"][href*="/search?q=%24"], a[href*="src=cashtag_click"][href*="/search?q=$"]';
const cashtagHrefPattern = /[?&]q=(?:%24|\$)([A-Z0-9]+)/iu;

export function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: amount >= 1000 ? 2 : 4,
  }).format(amount);
}

export function formatUsdCompact(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function symbolFromCashtagAnchor(element: HTMLAnchorElement) {
  const href = element.getAttribute('href') ?? '';
  return (href.match(cashtagHrefPattern)?.[1] ?? element.textContent ?? '')
    .replace(/^\$/u, '')
    .trim()
    .toUpperCase();
}

export function findCashtagAnchors(
  root: ParentNode,
  assetsByTicker: Map<string, AssetData>,
) {
  const found: { element: HTMLAnchorElement; asset: AssetData }[] = [];
  for (const element of root.querySelectorAll<HTMLAnchorElement>(
    cashtagAnchorSelector,
  )) {
    const asset = assetsByTicker.get(symbolFromCashtagAnchor(element));
    if (asset) {
      found.push({ element, asset });
    }
  }
  return found;
}
