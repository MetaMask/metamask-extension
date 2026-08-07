import type { AssetData } from './types';

// X cashtag links look like:
// <a href="/search?q=%24BTC&src=cashtag_click">$BTC</a>
const cashtagAnchorSelector =
  'a[href*="src=cashtag_click"][href*="/search?q=%24"], a[href*="src=cashtag_click"][href*="/search?q=$"]';
// Only inject inside tweet bodies (X uses data-testid="tweet").
const tweetAncestorSelector = '[data-testid="tweet"]';
const cashtagHrefPattern = /[?&]q=(?:%24|\$)([A-Z0-9]+)/iu;

export function formatUsd(amount: number) {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: amount >= 1000 ? 2 : amount >= 1 ? 2 : 4,
  }).format(amount);
}

export function formatUsdCompact(amount: number) {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatSignedUsd(amount: number) {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  const absolute = formatUsd(Math.abs(amount));
  if (amount > 0) {
    return `+${absolute}`;
  }
  if (amount < 0) {
    return `-${absolute}`;
  }
  return absolute;
}

export function formatPercent(amount: number) {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount.toFixed(2)}%`;
}

export function formatChartTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
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
    if (!element.closest(tweetAncestorSelector)) {
      continue;
    }
    const asset = assetsByTicker.get(symbolFromCashtagAnchor(element));
    if (asset) {
      found.push({ element, asset });
    }
  }
  return found;
}
