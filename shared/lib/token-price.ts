import {
  getNativeTokenAddress,
  type Asset,
  type CurrencyRateState,
  type MultichainAssetsRatesControllerState,
  type TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import { getNativeAssetId, isEvmChainId } from './asset-utils';
import { toChecksumHexAddress } from './hexstring-utils';

type MarketData = TokenRatesControllerState['marketData'];
type CurrencyRates = CurrencyRateState['currencyRates'];
type ConversionRates = MultichainAssetsRatesControllerState['conversionRates'];

const finiteNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

type CachedSpotPriceInput = {
  isNative: boolean;
  symbol: string;
  chainId: Hex | CaipChainId;
  /** EVM token address, or the non-EVM token asset id. */
  address?: string;
  marketData?: MarketData;
  currencyRates?: CurrencyRates;
  conversionRates?: ConversionRates;
};

/**
 * Cached spot price in the user's currency. Native tokens use the currency
 * rate, EVM tokens use the market price times that rate, and non-EVM assets
 * use their conversion rate. Missing data returns `undefined`.
 *
 * @param input - The asset identity and the cached rate maps.
 * @param input.isNative - Whether the asset is the chain's native token.
 * @param input.symbol - The asset symbol, used for the native currency rate.
 * @param input.chainId - The asset's chain id. This decides the EVM lookup and the non-EVM native asset id.
 * @param input.address - The EVM token address, or the non-EVM token asset id.
 * @param input.marketData - EVM market data keyed by chain id and address.
 * @param input.currencyRates - Fiat rates keyed by currency symbol.
 * @param input.conversionRates - Non-EVM rates keyed by asset id.
 * @returns The price, or `undefined` when it is not cached.
 */
export function getCachedSpotPrice({
  isNative,
  symbol,
  chainId,
  address,
  marketData,
  currencyRates,
  conversionRates,
}: CachedSpotPriceInput): number | undefined {
  if (isEvmChainId(chainId)) {
    if (isNative) {
      return finiteNumber(currencyRates?.[symbol]?.conversionRate);
    }

    if (!address) {
      return undefined;
    }

    const tokenMarket =
      marketData?.[chainId as Hex]?.[toChecksumHexAddress(address) as Hex];
    const exchangeRate = tokenMarket?.currency
      ? (currencyRates?.[tokenMarket.currency]?.conversionRate ?? undefined)
      : undefined;
    const price = tokenMarket?.price;

    return finiteNumber(
      exchangeRate !== undefined && price !== undefined
        ? exchangeRate * price
        : undefined,
    );
  }

  const rateKey = isNative ? getNativeAssetId(chainId) : address;
  if (!rateKey) {
    return undefined;
  }

  const rate = conversionRates?.[rateKey as CaipAssetType]?.rate;
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
  marketData: MarketData | undefined,
  currencyRates: CurrencyRates | undefined,
  conversionRates: ConversionRates | undefined,
): number | undefined {
  return getCachedSpotPrice({
    isNative: Boolean(asset.isNative),
    symbol: asset.symbol,
    chainId: asset.chainId,
    address: 'address' in asset ? asset.address : asset.assetId,
    marketData,
    currencyRates,
    conversionRates,
  });
}

type CachedPercentChangeInput = {
  isNative: boolean;
  chainId: Hex | CaipChainId;
  /** EVM token address, or the non-EVM asset id. */
  address?: string;
  marketData?: MarketData;
  conversionRates?: ConversionRates;
};

/**
 * Cached 24h percent change. EVM assets read `pricePercentChange1d`. Native
 * EVM assets use the chain's native token address, which is where that change
 * is stored. Non-EVM assets read the P1D conversion-rate change.
 *
 * @param input - The asset identity and the cached rate maps.
 * @param input.isNative - Whether the asset is the chain's native token.
 * @param input.chainId - The asset's chain id. This decides the EVM lookup.
 * @param input.address - The EVM token address, or the non-EVM asset id.
 * @param input.marketData - EVM market data keyed by chain id and address.
 * @param input.conversionRates - Non-EVM rates keyed by asset id.
 * @returns The percent change, or `undefined` when it is not cached.
 */
export function getCachedPercentChange({
  isNative,
  chainId,
  address,
  marketData,
  conversionRates,
}: CachedPercentChangeInput): number | undefined {
  const evm = isEvmChainId(chainId);
  const tokenAddress =
    evm && isNative ? getNativeTokenAddress(chainId as Hex) : address;

  if (!tokenAddress) {
    return undefined;
  }

  if (evm) {
    return finiteNumber(
      marketData?.[chainId as Hex]?.[toChecksumHexAddress(tokenAddress) as Hex]
        ?.pricePercentChange1d,
    );
  }

  return finiteNumber(
    conversionRates?.[tokenAddress as CaipAssetType]?.marketData
      ?.pricePercentChange?.P1D,
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
  marketData: MarketData | undefined,
  conversionRates: ConversionRates | undefined,
): number | undefined {
  return getCachedPercentChange({
    isNative: Boolean(asset.isNative),
    chainId: asset.chainId,
    address: 'address' in asset ? asset.address : asset.assetId,
    marketData,
    conversionRates,
  });
}
