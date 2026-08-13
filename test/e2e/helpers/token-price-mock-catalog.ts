import { Mockttp } from 'mockttp';
import { MOCK_ETH_CONVERSION_RATE } from '../tests/tokens/utils/mocks';

export type PriceMode = 'quoted' | 'unsupported';

/**
 * One asset the catalog can answer for. Callers pass exact CAIP-19 ids and/or
 * CAIP-2 prefixes (with a trailing slash) so native slip44 segments that are
 * derived at runtime still match. Exact ids take precedence over prefixes.
 */
export type CatalogAsset = {
  name: string;
  symbol: string;
  decimals: number;
  priceInUsd?: number;
  assetIds?: string[];
  idPrefixes?: string[];
};

export type CatalogRequest = {
  assets: CatalogAsset[];
  priceMode: PriceMode;
  requestedAssetIds: string[];
};

type SpotPriceEntry = {
  id: string;
  price: number;
  marketCap: number;
  totalVolume: number;
  dilutedMarketCap: number;
  pricePercentChange1d: number;
};

type ExchangeRateEntry = {
  name: string;
  ticker: string;
  value: number;
  currencyType: string;
};

export type CatalogResponses = {
  spotPrices: Record<string, SpotPriceEntry>;
  exchangeRates: Record<string, ExchangeRateEntry>;
  assetsMetadata: {
    assetId: string;
    name: string;
    symbol: string;
    decimals: number;
  }[];
};

const ETH_USD_EXCHANGE_RATES: Record<string, ExchangeRateEntry> = {
  eth: {
    name: 'Ether',
    ticker: 'eth',
    value: 1 / MOCK_ETH_CONVERSION_RATE,
    currencyType: 'crypto',
  },
  usd: {
    name: 'US Dollar',
    ticker: 'usd',
    value: 1,
    currencyType: 'fiat',
  },
};

function assetMatchesExact(asset: CatalogAsset, requestedId: string): boolean {
  return Boolean(asset.assetIds?.includes(requestedId));
}

function assetMatchesPrefix(asset: CatalogAsset, requestedId: string): boolean {
  return Boolean(
    asset.idPrefixes?.some((prefix) => requestedId.startsWith(prefix)),
  );
}

/**
 * Resolve each requested id to one catalog entry. Exact `assetIds` win over
 * `idPrefixes` so a whole-chain native prefix (e.g. `eip155:50/`) cannot
 * steal a later ERC-20 that lists the same id.
 * @param assets
 * @param requestedAssetIds
 */
function matchingAssets(
  assets: CatalogAsset[],
  requestedAssetIds: string[],
): { requestedId: string; asset: CatalogAsset }[] {
  const matches: { requestedId: string; asset: CatalogAsset }[] = [];
  for (const requestedId of requestedAssetIds) {
    const asset =
      assets.find((candidate) => assetMatchesExact(candidate, requestedId)) ??
      assets.find((candidate) => assetMatchesPrefix(candidate, requestedId));
    if (asset) {
      matches.push({ requestedId, asset });
    }
  }
  return matches;
}

/**
 * Pure catalog: given assets, a price mode, and the ids the UI requested,
 * produce the three Token/Price response bodies. This is the catalog's
 * test surface.
 * @param request
 */
export function catalogResponses(request: CatalogRequest): CatalogResponses {
  const matches = matchingAssets(request.assets, request.requestedAssetIds);

  const assetsMetadata = matches.map(({ requestedId, asset }) => ({
    assetId: requestedId,
    name: asset.name,
    symbol: asset.symbol,
    decimals: asset.decimals,
  }));

  switch (request.priceMode) {
    case 'unsupported':
      return {
        spotPrices: {},
        exchangeRates: ETH_USD_EXCHANGE_RATES,
        assetsMetadata,
      };
    case 'quoted': {
      const spotPrices: Record<string, SpotPriceEntry> = {};
      for (const { requestedId, asset } of matches) {
        spotPrices[requestedId] = {
          id: asset.symbol.toLowerCase(),
          price: asset.priceInUsd ?? MOCK_ETH_CONVERSION_RATE,
          marketCap: 112500000,
          totalVolume: 4500000,
          dilutedMarketCap: 120000000,
          pricePercentChange1d: 0,
        };
      }
      return {
        spotPrices,
        exchangeRates: ETH_USD_EXCHANGE_RATES,
        assetsMetadata,
      };
    }
    default: {
      const exhaustive: never = request.priceMode;
      throw new Error(`Unknown price mode: ${String(exhaustive)}`);
    }
  }
}

export function requestedAssetIdsFromUrl(url: string): string[] {
  return new URL(url).searchParams
    .getAll('assetIds')
    .join(',')
    .split(',')
    .filter(Boolean);
}

/**
 * Mockttp adapter: one handler per Token/Price URL so later `always()`
 * registrations cannot silently shadow earlier ones.
 * @param mockServer
 * @param options
 * @param options.assets
 * @param options.priceMode
 */
export async function mockTokenAndPriceApis(
  mockServer: Mockttp,
  options: { assets: CatalogAsset[]; priceMode: PriceMode },
) {
  const { assets, priceMode } = options;

  const spotPricesMock = await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback((request) => {
      const { spotPrices } = catalogResponses({
        assets,
        priceMode,
        requestedAssetIds: requestedAssetIdsFromUrl(request.url),
      });
      return { statusCode: 200, json: spotPrices };
    });

  const exchangeRatesMock = await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .always()
    .thenCallback(() => {
      const { exchangeRates } = catalogResponses({
        assets,
        priceMode,
        requestedAssetIds: [],
      });
      return { statusCode: 200, json: exchangeRates };
    });

  const assetsMetadataMock = await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => {
      const { assetsMetadata } = catalogResponses({
        assets,
        priceMode,
        requestedAssetIds: requestedAssetIdsFromUrl(request.url),
      });
      return { statusCode: 200, json: assetsMetadata };
    });

  return [spotPricesMock, exchangeRatesMock, assetsMetadataMock];
}
