import {
  getNativeTokenAddress,
  type Asset,
  type CurrencyRateState,
  type MultichainAssetsRatesControllerState,
  type TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { getNativeAssetId, isEvmChainId } from './asset-utils';
import { toChecksumHexAddress } from './hexstring-utils';

type MarketData = {
  [chainId: string]:
    | {
        [address: string]:
          | {
              price?: number;
              currency?: string;
              pricePercentChange1d?: number;
            }
          | undefined;
      }
    | undefined;
};

type CurrencyRates = {
  [currency: string]:
    | {
        conversionRate?: number | null;
      }
    | undefined;
};

type ConversionRates = {
  [assetId: string]:
    | {
        rate?: string | null;
        marketData?: {
          pricePercentChange?: Partial<Record<'P1D', number | null>>;
        };
      }
    | undefined;
};

type MarketDataSource = TokenRatesControllerState['marketData'] | MarketData;
type CurrencyRatesSource = CurrencyRateState['currencyRates'] | CurrencyRates;
type ConversionRatesSource =
  | MultichainAssetsRatesControllerState['conversionRates']
  | ConversionRates;

type CachedSpotPriceInput = {
  isEvm: boolean;
  isNative: boolean;
  symbol: string;
  chainId: string;
  /** EVM token address, or the non-EVM token asset id. */
  address?: string;
  /** Non-EVM native asset id. */
  nativeAssetId?: string;
  marketData?: MarketDataSource;
  currencyRates?: CurrencyRatesSource;
  conversionRates?: ConversionRatesSource;
};

/**
 * Cached spot price in the user's currency. Native tokens use the currency
 * rate, EVM tokens use the market price times that rate, and non-EVM assets
 * use their conversion rate. Missing data returns `undefined`.
 *
 * @param input - The asset identity and the cached rate maps.
 * @param input.isEvm - Whether the asset is on an EVM chain.
 * @param input.isNative - Whether the asset is the chain's native token.
 * @param input.symbol - The asset symbol, used for the native currency rate.
 * @param input.chainId - The asset's chain id.
 * @param input.address - The EVM token address, or the non-EVM token asset id.
 * @param input.nativeAssetId - The non-EVM native asset id.
 * @param input.marketData - EVM market data keyed by chain id and address.
 * @param input.currencyRates - Fiat rates keyed by currency symbol.
 * @param input.conversionRates - Non-EVM rates keyed by asset id.
 * @returns The price, or `undefined` when it is not cached.
 */
export function getCachedSpotPrice({
  isEvm,
  isNative,
  symbol,
  chainId,
  address,
  nativeAssetId,
  marketData,
  currencyRates,
  conversionRates,
}: CachedSpotPriceInput): number | undefined {
  const cachedMarketData = marketData as MarketData | undefined;
  const cachedCurrencyRates = currencyRates as CurrencyRates | undefined;
  const cachedConversionRates = conversionRates as ConversionRates | undefined;

  if (isEvm) {
    if (isNative) {
      return cachedCurrencyRates?.[symbol]?.conversionRate ?? undefined;
    }

    if (!address) {
      return undefined;
    }

    const checksumAddress = toChecksumHexAddress(address);
    const tokenMarket = cachedMarketData?.[chainId]?.[checksumAddress];
    const exchangeRate = tokenMarket?.currency
      ? (cachedCurrencyRates?.[tokenMarket.currency]?.conversionRate ??
        undefined)
      : undefined;
    const price = tokenMarket?.price;

    return exchangeRate !== undefined && price !== undefined
      ? exchangeRate * price
      : undefined;
  }

  const rateKey = isNative ? nativeAssetId : address;
  if (!rateKey) {
    return undefined;
  }

  const rate = cachedConversionRates?.[rateKey]?.rate;
  if (!rate) {
    return undefined;
  }

  const parsed = parseFloat(rate);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * The cached spot price of a list asset. This is the price the token table
 * shows for that row.
 *
 * @param asset - The asset to price.
 * @param marketData - EVM market data keyed by chain id and token address.
 * @param currencyRates - Fiat conversion rates keyed by currency symbol.
 * @param conversionRates - Non-EVM rates keyed by asset id.
 * @returns The price, or `undefined` when it is not cached.
 */
export function getCachedTokenPrice(
  asset: Asset,
  marketData: MarketDataSource | undefined,
  currencyRates: CurrencyRatesSource | undefined,
  conversionRates: ConversionRatesSource | undefined,
): number | undefined {
  return getCachedSpotPrice({
    isEvm: isEvmChainId(asset.chainId),
    isNative: Boolean(asset.isNative),
    symbol: asset.symbol,
    chainId: asset.chainId,
    address: 'address' in asset ? asset.address : asset.assetId,
    nativeAssetId: getNativeAssetId(asset.chainId),
    marketData,
    currencyRates,
    conversionRates,
  });
}

type CachedPercentChangeInput = {
  isEvm: boolean;
  isNative: boolean;
  chainId: string;
  /** EVM token address, or the non-EVM asset id. */
  address?: string;
  marketData?: MarketDataSource;
  conversionRates?: ConversionRatesSource;
};

const finiteNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Cached 24h percent change. EVM assets read `pricePercentChange1d`. Native
 * EVM assets use the chain's native token address, which is where that change
 * is stored. Non-EVM assets read the P1D conversion-rate change.
 *
 * @param input - The asset identity and the cached rate maps.
 * @param input.isEvm - Whether the asset is on an EVM chain.
 * @param input.isNative - Whether the asset is the chain's native token.
 * @param input.chainId - The asset's chain id.
 * @param input.address - The EVM token address, or the non-EVM asset id.
 * @param input.marketData - EVM market data keyed by chain id and address.
 * @param input.conversionRates - Non-EVM rates keyed by asset id.
 * @returns The percent change, or `undefined` when it is not cached.
 */
export function getCachedPercentChange({
  isEvm,
  isNative,
  chainId,
  address,
  marketData,
  conversionRates,
}: CachedPercentChangeInput): number | undefined {
  const cachedMarketData = marketData as MarketData | undefined;
  const cachedConversionRates = conversionRates as ConversionRates | undefined;
  const tokenAddress =
    isEvm && isNative ? getNativeTokenAddress(chainId as Hex) : address;

  if (!tokenAddress) {
    return undefined;
  }

  if (isEvm) {
    const checksumAddress = toChecksumHexAddress(tokenAddress);
    return finiteNumber(
      cachedMarketData?.[chainId]?.[checksumAddress]?.pricePercentChange1d,
    );
  }

  return finiteNumber(
    cachedConversionRates?.[tokenAddress]?.marketData?.pricePercentChange?.P1D,
  );
}

/**
 * The cached 24h percent change of a list asset. This is the change the token
 * table shows for that row.
 *
 * @param asset - The asset to read.
 * @param marketData - EVM market data keyed by chain id and token address.
 * @param conversionRates - Non-EVM rates keyed by asset id.
 * @returns The percent change, or `undefined` when it is not cached.
 */
export function getCachedTokenPercentChange(
  asset: Asset,
  marketData: MarketDataSource | undefined,
  conversionRates: ConversionRatesSource | undefined,
): number | undefined {
  return getCachedPercentChange({
    isEvm: isEvmChainId(asset.chainId),
    isNative: Boolean(asset.isNative),
    chainId: asset.chainId,
    address: 'address' in asset ? asset.address : asset.assetId,
    marketData,
    conversionRates,
  });
}
