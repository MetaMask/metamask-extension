import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { priceApiBaseUrl } from '#shared/constants/price-api';
import { TOKEN_API_METASWAP_CODEFI_URL } from '#shared/constants/tokens';
import { getCaipAssetImageUrl } from '#shared/lib/asset-utils';
import type { AssetData, PricePoint, ResolvedTicker } from './types';

const tokenSearchUrl = `${TOKEN_API_METASWAP_CODEFI_URL}search`;
const historicalPricesUrl = `${priceApiBaseUrl}/v3/historical-prices`;
const clientIdHeader = { 'X-Client-Id': 'extension' };

type SearchHit = {
  assetId: CaipAssetType;
  symbol: string;
  name: string;
  securityData?: { resultType?: string };
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

function toAssetData(hit: SearchHit): AssetData {
  const liquidity = num(hit.liquidity);
  return {
    ticker: hit.symbol,
    name: hit.name,
    iconUrl: getCaipAssetImageUrl(hit.assetId) ?? null,
    color: null,
    caipAssetId: hit.assetId,
    chainId: chainIdFromAssetId(hit.assetId),
    isNative: hit.assetId.includes('/slip44:'),
    resultType: hit.securityData?.resultType ?? null,
    price: num(hit.price),
    change24hPercent: num(hit.pricePercentChange1d),
    marketCap: num(hit.marketCap),
    liquidity: liquidity !== null && liquidity > 0 ? liquidity : null,
    volume24h: num(hit.aggregatedUsdVolume),
  };
}

async function searchBySymbol(symbol: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    query: symbol,
    first: '25',
    includeMarketData: 'true',
    includeTokenSecurityData: 'true',
  });
  const response = await globalThis.fetch(`${tokenSearchUrl}?${params}`, {
    method: 'GET',
    headers: clientIdHeader,
  });
  if (!response.ok) {
    return [];
  }
  const body = (await response.json()) as { data?: SearchHit[] };
  return body.data ?? [];
}

export async function fetchPriceHistory(
  caipAssetId: string,
): Promise<PricePoint[] | null> {
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
    const points = (body.prices ?? [])
      .filter(
        (point): point is [number, number] =>
          Array.isArray(point) &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1]),
      )
      .map(([time, value]) => ({ time, value }));

    return points.length >= 2 ? points : null;
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

  const matches = await searchBySymbol(ticker);
  const symbolMatches = matches.filter((match) =>
    match.symbol.trim().toUpperCase().startsWith(ticker),
  );
  if (symbolMatches.length === 0) {
    return null;
  }

  const assets = symbolMatches.map(toAssetData);
  return {
    primary: assets[0],
    similar: assets.slice(1),
  };
}
