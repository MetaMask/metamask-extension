import type { CashtagAsset } from './types';

const cashtagAnchorSelector =
  'a[href*="/search?q=%24"], a[href*="/search?q=$"]';
const cashtagHrefPattern = /[?&]q=%24([A-Z0-9]+)/iu;

export function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: amount >= 1000 ? 2 : 4,
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
  assetsBySymbol: Map<string, CashtagAsset>,
) {
  const found: { element: HTMLAnchorElement; asset: CashtagAsset }[] = [];
  for (const element of root.querySelectorAll<HTMLAnchorElement>(
    cashtagAnchorSelector,
  )) {
    const asset = assetsBySymbol.get(symbolFromCashtagAnchor(element));
    if (asset) {
      found.push({ element, asset });
    }
  }
  return found;
}
