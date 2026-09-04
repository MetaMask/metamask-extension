import type { CaipChainId } from '@metamask/utils';
import { isCaipChainId } from '@metamask/utils';
import { createFormatters } from '@metamask/client-utils';
import browser from 'webextension-polyfill';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '#shared/constants/multichain/networks';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '#shared/constants/network';
import { isEvmChainId } from '#shared/lib/asset-utils';
import { convertCaipToHexChainId } from '#shared/lib/network.utils';

// X cashtag links look like:
// <a href="/search?q=%24BTC&src=cashtag_click">$BTC</a>
const cashtagAnchorSelector =
  'a[href*="src=cashtag_click"][href*="/search?q=%24"], a[href*="src=cashtag_click"][href*="/search?q=$"]';
// Only inject inside tweet bodies (X uses data-testid="tweet").
const tweetAncestorSelector = '[data-testid="tweet"]';
const cashtagHrefPattern = /[?&]q=(?:%24|\$)([A-Z0-9]+)/iu;

const { formatCurrency, formatCurrencyCompact, formatCurrencyTokenPrice } =
  createFormatters({
    locale: 'en-US',
  });

const chainImageMap: Record<string, string> = {
  ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  ...MULTICHAIN_TOKEN_IMAGE_MAP,
};

function relativeChainImagePath(chainId: string) {
  const direct = chainImageMap[chainId];
  if (direct) {
    return direct;
  }

  if (isCaipChainId(chainId) && isEvmChainId(chainId)) {
    try {
      return chainImageMap[convertCaipToHexChainId(chainId as CaipChainId)];
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function getChainImageUrl(chainId: string | null | undefined) {
  if (!chainId) {
    return null;
  }

  const relative = relativeChainImagePath(chainId);
  if (!relative) {
    return null;
  }

  return browser.runtime.getURL(relative.replace(/^\.\//u, ''));
}

export function formatUsd(amount: number) {
  return formatCurrencyTokenPrice(amount, 'USD') || '—';
}

export function formatUsdCompact(amount: number) {
  return formatCurrencyCompact(amount, 'USD') || '—';
}

export function formatSignedUsd(amount: number) {
  return formatCurrency(amount, 'USD', { signDisplay: 'always' }) || '—';
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
  return (cashtagHrefPattern.exec(href)?.[1] ?? element.textContent ?? '')
    .replace(/^\$/u, '')
    .trim()
    .toUpperCase();
}

export function findCashtagAnchors(root: ParentNode) {
  const found: { element: HTMLAnchorElement; symbol: string }[] = [];
  for (const element of root.querySelectorAll<HTMLAnchorElement>(
    cashtagAnchorSelector,
  )) {
    if (!element.closest(tweetAncestorSelector)) {
      continue;
    }
    const symbol = symbolFromCashtagAnchor(element);
    if (symbol) {
      found.push({ element, symbol });
    }
  }
  return found;
}
