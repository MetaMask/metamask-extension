import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { TOKEN_API_METASWAP_CODEFI_URL } from '#shared/constants/tokens';
import { getCaipAssetImageUrl } from '#shared/lib/asset-utils';
import type { AssetData, ResolvedTicker } from './types';

const tokenSearchUrl = `${TOKEN_API_METASWAP_CODEFI_URL}search`;
const historicalPricesUrl =
  'https://price.api.cx.metamask.io/v3/historical-prices';
const clientIdHeader = { 'X-Client-Id': 'extension' };

type SearchHit = {
  assetId: CaipAssetType;
  symbol: string;
  name: string;
  isVerified?: boolean;
  price?: string | number | null;
  marketCap?: string | number | null;
  aggregatedUsdVolume?: string | number | null;
  pricePercentChange1d?: string | number | null;
  liquidity?: string | number | null;
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

function chainIdFromAssetId(assetId: string): CaipChainId | null {
  const chainId = assetId.split('/')[0];
  return chainId ? (chainId as CaipChainId) : null;
}

function toAssetData(hit: SearchHit, ticker: string): AssetData {
  return {
    ticker,
    name: hit.name,
    iconUrl: getCaipAssetImageUrl(hit.assetId) ?? null,
    color: null,
    caipAssetId: hit.assetId,
    chainId: chainIdFromAssetId(hit.assetId),
    isNative: hit.assetId.includes('/slip44:'),
    verified: hit.isVerified === true,
    price: num(hit.price),
    change24hPercent: num(hit.pricePercentChange1d),
    marketCap: num(hit.marketCap),
    liquidity: num(hit.liquidity),
    volume24h: num(hit.aggregatedUsdVolume),
  };
}

function compareHits(left: SearchHit, right: SearchHit) {
  const leftCap = num(left.marketCap) ?? -1;
  const rightCap = num(right.marketCap) ?? -1;
  if (rightCap !== leftCap) {
    return rightCap - leftCap;
  }
  const leftNative = left.assetId.includes('/slip44:') ? 1 : 0;
  const rightNative = right.assetId.includes('/slip44:') ? 1 : 0;
  return rightNative - leftNative;
}

async function searchBySymbol(symbol: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    query: symbol,
    first: '25',
    includeMarketData: 'true',
  });
  const response = await globalThis.fetch(`${tokenSearchUrl}?${params}`, {
    method: 'GET',
    headers: clientIdHeader,
  });
  if (!response.ok) {
    return [];
  }
  const body = (await response.json()) as { data?: SearchHit[] };
  return (body.data ?? []).filter(
    (hit) => hit.symbol.toUpperCase() === symbol.toUpperCase(),
  );
}

export async function fetchPriceHistory(
  caipAssetId: string,
): Promise<number[] | null> {
  const separator = caipAssetId.indexOf('/');
  if (separator === -1) {
    return null;
  }

  const caipChainId = caipAssetId.slice(0, separator);
  const assetType = caipAssetId.slice(separator + 1);
  if (!caipChainId || !assetType) {
    return null;
  }

  const params = new URLSearchParams({
    vsCurrency: 'usd',
    timePeriod: '1D',
  });

  try {
    const response = await globalThis.fetch(
      `${historicalPricesUrl}/${caipChainId}/${assetType}?${params}`,
      {
        method: 'GET',
        headers: clientIdHeader,
      },
    );
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as {
      prices?: [number, number][];
    };
    const values = (body.prices ?? [])
      .map((point) => point?.[1])
      .filter(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value),
      );

    return values.length >= 2 ? values : null;
  } catch {
    return null;
  }
}

export async function resolveTicker(
  symbol: string,
): Promise<ResolvedTicker | null> {
  const ticker = symbol.trim().toUpperCase();
  if (!ticker) {
    return null;
  }

  const matches = (await searchBySymbol(ticker)).sort(compareHits);
  if (matches.length === 0) {
    return null;
  }

  const assets = matches.map((hit) => toAssetData(hit, ticker));
  return {
    primary: assets[0],
    similar: assets.slice(1),
  };
}
