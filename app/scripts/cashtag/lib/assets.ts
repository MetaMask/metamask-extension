import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import type { AssetData } from './types';

const TOKEN_SEARCH_URL = 'https://token.api.cx.metamask.io/tokens/search';
const PRICE_URL = 'https://price.api.cx.metamask.io/v3/spot-prices';
const ICON_BASE = 'https://static.cx.metamask.io/api/v2/tokenIcons/assets';
const ETHEREUM = 'eip155:1' as CaipChainId;
const BNB_CHAIN = 'eip155:56' as CaipChainId;
const AVALANCHE = 'eip155:43114' as CaipChainId;

export const assetsWhitelist: { symbol: string; chainId: CaipChainId }[] = [
  { symbol: 'BTC', chainId: MultichainNetworks.BITCOIN },
  { symbol: 'ETH', chainId: ETHEREUM },
  { symbol: 'USDT', chainId: ETHEREUM },
  { symbol: 'BNB', chainId: BNB_CHAIN },
  { symbol: 'USDC', chainId: ETHEREUM },
  { symbol: 'XRP', chainId: ETHEREUM },
  { symbol: 'SOL', chainId: MultichainNetworks.SOLANA },
  { symbol: 'TRX', chainId: MultichainNetworks.TRON },
  { symbol: 'FIGR_HELOC', chainId: ETHEREUM },
  { symbol: 'WBT', chainId: ETHEREUM },
  { symbol: 'HYPE', chainId: ETHEREUM },
  { symbol: 'DOGE', chainId: ETHEREUM },
  { symbol: 'USDS', chainId: ETHEREUM },
  { symbol: 'RAIN', chainId: ETHEREUM },
  { symbol: 'ZEC', chainId: ETHEREUM },
  { symbol: 'LEO', chainId: ETHEREUM },
  { symbol: 'XMR', chainId: ETHEREUM },
  { symbol: 'LINK', chainId: ETHEREUM },
  { symbol: 'ADA', chainId: ETHEREUM },
  { symbol: 'XLM', chainId: MultichainNetworks.STELLAR },
  { symbol: 'CC', chainId: ETHEREUM },
  { symbol: 'DAI', chainId: ETHEREUM },
  { symbol: 'BCH', chainId: ETHEREUM },
  { symbol: 'USD1', chainId: ETHEREUM },
  { symbol: 'USDE', chainId: ETHEREUM },
  { symbol: 'GRAM', chainId: ETHEREUM },
  { symbol: 'LTC', chainId: ETHEREUM },
  { symbol: 'USDG', chainId: ETHEREUM },
  { symbol: 'HBAR', chainId: ETHEREUM },
  { symbol: 'SUI', chainId: ETHEREUM },
  { symbol: 'AVAX', chainId: AVALANCHE },
  { symbol: 'PYUSD', chainId: ETHEREUM },
  { symbol: 'CRO', chainId: ETHEREUM },
  { symbol: 'BUIDL', chainId: ETHEREUM },
  { symbol: 'NEAR', chainId: ETHEREUM },
  { symbol: 'XAUT', chainId: ETHEREUM },
  { symbol: 'SHIB', chainId: ETHEREUM },
  { symbol: 'UNI', chainId: ETHEREUM },
  { symbol: 'USDY', chainId: ETHEREUM },
  { symbol: 'ONDO', chainId: ETHEREUM },
];

type SearchHit = {
  assetId: CaipAssetType;
  symbol: string;
  name: string;
};

type SpotQuote = {
  price?: string | number | null;
  marketCap?: string | number | null;
  totalVolume?: string | number | null;
  pricePercentChange1d?: string | number | null;
};

function num(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickHit(symbol: string, hits: SearchHit[]) {
  const matches = hits.filter(
    (hit) => hit.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  return (
    matches.find((hit) => hit.assetId.includes('/slip44:')) ??
    matches[0] ??
    null
  );
}

async function lookup(symbol: string, chainId: CaipChainId) {
  const params = new URLSearchParams({
    query: symbol,
    networks: chainId,
    first: '25',
  });
  const response = await globalThis.fetch(`${TOKEN_SEARCH_URL}?${params}`, {
    method: 'GET',
    headers: { 'X-Client-Id': 'extension' },
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { data?: SearchHit[] };
  return pickHit(symbol, body.data ?? []);
}

async function fetchQuotes(assetIds: string[]) {
  if (assetIds.length === 0) {
    return new Map<string, SpotQuote>();
  }

  const params = new URLSearchParams({
    assetIds: assetIds.join(','),
    vsCurrency: 'usd',
    includeMarketData: 'true',
  });
  const response = await globalThis.fetch(`${PRICE_URL}?${params}`, {
    method: 'GET',
    headers: { 'X-Client-Id': 'extension' },
  });
  if (!response.ok) {
    return new Map<string, SpotQuote>();
  }

  const body = (await response.json()) as Record<string, SpotQuote>;
  return new Map(Object.entries(body));
}

export async function fetchAssetData(): Promise<AssetData[]> {
  const identities: {
    symbol: string;
    chainId: CaipChainId;
    hit: SearchHit;
  }[] = [];

  await Promise.all(
    assetsWhitelist.map(async ({ symbol, chainId }) => {
      try {
        const hit = await lookup(symbol, chainId);
        if (hit) {
          identities.push({ symbol, chainId, hit });
        }
      } catch {
        // skip failed lookups
      }
    }),
  );

  const quotes = await fetchQuotes(identities.map(({ hit }) => hit.assetId));

  return identities.map(({ symbol, chainId, hit }) => {
    const quote = quotes.get(hit.assetId);
    return {
      ticker: symbol,
      name: hit.name,
      iconUrl:
        getAssetImageUrl(hit.assetId, chainId) ??
        `${ICON_BASE}/${hit.assetId.replaceAll(':', '/')}.png`,
      color: null,
      caipAssetId: hit.assetId,
      chainId,
      isNative: hit.assetId.includes('/slip44:'),
      verified: true,
      price: num(quote?.price),
      change24hPercent: num(quote?.pricePercentChange1d),
      marketCap: num(quote?.marketCap),
      liquidity: null,
      volume24h: num(quote?.totalVolume),
      sparkline: null,
    };
  });
}
