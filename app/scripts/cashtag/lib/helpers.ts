import type { CaipChainId } from '@metamask/utils';
import { isCaipChainId } from '@metamask/utils';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';

// X cashtag links look like:
// <a href="/search?q=%24BTC&src=cashtag_click">$BTC</a>
const cashtagAnchorSelector =
  'a[href*="src=cashtag_click"][href*="/search?q=%24"], a[href*="src=cashtag_click"][href*="/search?q=$"]';
// Only inject inside tweet bodies (X uses data-testid="tweet").
const tweetAncestorSelector = '[data-testid="tweet"]';
const cashtagHrefPattern = /[?&]q=(?:%24|\$)([A-Z0-9]+)/iu;

const networkImageCdn =
  'https://cdn.jsdelivr.net/gh/MetaMask/metamask-extension@main/app/images';

const chainImageUrlByCaip: Record<string, string> = {
  'eip155:1': `${networkImageCdn}/eth_logo.svg`,
  'eip155:56': `${networkImageCdn}/bnb.svg`,
  'eip155:137': `${networkImageCdn}/pol-token.svg`,
  'eip155:43114': `${networkImageCdn}/avax-token.svg`,
  'eip155:10': `${networkImageCdn}/optimism.svg`,
  'eip155:42161': `${networkImageCdn}/arbitrum.svg`,
  'eip155:8453': `${networkImageCdn}/base.svg`,
  'bip122:000000000019d6689c085ae165831e93': `${networkImageCdn}/bitcoin-logo.svg`,
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': `${networkImageCdn}/solana-logo.svg`,
  'tron:728126428': `${networkImageCdn}/tron-logo.svg`,
  'stellar:pubnet': `${networkImageCdn}/xlm.svg`,
};

const chainImageUrlByHex: Record<string, string> = {
  '0x1': chainImageUrlByCaip['eip155:1'],
  '0x38': chainImageUrlByCaip['eip155:56'],
  '0x89': chainImageUrlByCaip['eip155:137'],
  '0xa86a': chainImageUrlByCaip['eip155:43114'],
  '0xa': chainImageUrlByCaip['eip155:10'],
  '0xa4b1': chainImageUrlByCaip['eip155:42161'],
  '0x2105': chainImageUrlByCaip['eip155:8453'],
};

export function getChainImageUrl(chainId: string | null | undefined) {
  if (!chainId) {
    return null;
  }

  const direct = chainImageUrlByCaip[chainId] ?? chainImageUrlByHex[chainId];
  if (direct) {
    return direct;
  }

  if (isCaipChainId(chainId) && chainId.startsWith('eip155:')) {
    try {
      const hex = convertCaipToHexChainId(chainId as CaipChainId);
      return chainImageUrlByHex[hex] ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

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
