import {
  type CaipAssetType,
  isStrictHexString,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { ContractMarketData } from '@metamask/assets-controllers';
import {
  ChainId,
  type TxData,
  BridgeClientId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
  isNonEvmChainId,
  formatChainIdToHex,
  isBitcoinChainId,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../shared/constants/bridge';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../shared/constants/multichain/networks';
import {
  TRON_RESOURCE_SYMBOLS_SET,
  type TronResourceSymbol,
} from '../../../shared/constants/multichain/assets';
import type { TokenPayload, BridgeToken } from './types';

// Re-export isNonEvmChainId from bridge-controller for backward compatibility
export { isNonEvmChainId as isNonEvmChain } from '@metamask/bridge-controller';

// Re-export isTronChainId from confirmations utils for consistency
export { isTronChainId } from '../../pages/confirmations/utils/network';

/**
 * Checks if a token is a Tron Energy or Bandwidth resource (not tradeable assets)
 *
 * @param chainId - The chain ID to check
 * @param symbol - The token symbol to check
 * @returns true if the token is a Tron Energy/Bandwidth resource
 */
export const isTronEnergyOrBandwidthResource = (
  chainId: ChainId | Hex | CaipChainId | string | undefined,
  symbol: string | undefined,
): boolean => {
  return (
    Boolean(chainId?.toString()?.includes('tron:')) &&
    TRON_RESOURCE_SYMBOLS_SET.has(symbol?.toLowerCase() as TronResourceSymbol)
  );
};

/**
 * Safely gets the native token name for a given chainId.
 * Returns undefined if the chainId is not supported by the bridge controller.
 *
 * @param chainId - The chain ID to get the native token name for
 * @returns The human-readable name of the native token, or undefined if not supported
 */
export const getNativeTokenName = (chainId: string): string | undefined => {
  try {
    return getNativeAssetForChainId(chainId)?.name;
  } catch {
    // Return undefined for unsupported chains (e.g., test chains)
    return undefined;
  }
};

type GasFeeEstimate = {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
};

type NetworkGasFeeEstimates = {
  low: GasFeeEstimate;
  medium: GasFeeEstimate;
  high: GasFeeEstimate;
  estimatedBaseFee: string;
  historicalBaseFeeRange: [string, string];
  baseFeeTrend: 'up' | 'down';
  latestPriorityFeeRange: [string, string];
  historicalPriorityFeeRange: [string, string];
  priorityFeeTrend: 'up' | 'down';
  networkCongestion: number;
};

// We don't need to use gas multipliers here because the gasLimit from Bridge API already included it
export const getHexMaxGasLimit = (gasLimit: number) => {
  return new Numeric(
    new BigNumber(gasLimit).toString(),
    10,
  ).toPrefixedHexString() as Hex;
};
/**
 * Converts basis points (BPS) to percentage
 * 1 BPS = 0.01%
 *
 * @param bps - The value in basis points (e.g., "87.5" or 87.5)
 * @returns The percentage value as a string (e.g., "0.875")
 */
export const bpsToPercentage = (
  bps: string | number | undefined,
): string | undefined => {
  if (bps === undefined || bps === null) {
    return undefined;
  }

  const bpsValue = typeof bps === 'string' ? parseFloat(bps) : bps;

  if (isNaN(bpsValue)) {
    return undefined;
  }

  // BPS to percentage: divide by 100
  return (bpsValue / 100).toString();
};

export const getTxGasEstimates = async ({
  networkAndAccountSupports1559,
  networkGasFeeEstimates,
  txParams,
  hexChainId,
}: {
  networkAndAccountSupports1559: boolean;
  networkGasFeeEstimates: NetworkGasFeeEstimates;
  txParams: TxData;
  hexChainId: Hex;
}) => {
  if (networkAndAccountSupports1559) {
    const { estimatedBaseFee = '0' } = networkGasFeeEstimates;
    const hexEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFee) as Hex;
    const txGasFeeEstimates = await getTransaction1559GasFeeEstimates(
      {
        ...txParams,
        chainId: hexChainId,
        gasLimit: txParams.gasLimit?.toString(),
      },
      hexEstimatedBaseFee,
      hexChainId,
    );
    return txGasFeeEstimates;
  }

  return {
    baseAndPriorityFeePerGas: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };
};

const fetchTokenExchangeRates = async (
  chainId: Hex | CaipChainId | ChainId,
  currency: string,
  signal?: AbortSignal,
  ...tokenAddresses: string[]
) => {
  const assetIds = tokenAddresses
    .map((address) => toAssetId(address, formatChainIdToCaip(chainId)))
    .filter(Boolean);
  if (assetIds.length === 0) {
    return {};
  }
  const queryParams = new URLSearchParams({
    assetIds: assetIds.join(','),
    includeMarketData: 'true',
    vsCurrency: currency,
  });
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const url = `https://price.api.cx.metamask.io/v3/spot-prices?${queryParams}`;
  const tokenV3PriceResponse = (await handleFetch(url, {
    method: 'GET',
    headers: { 'X-Client-Id': BridgeClientId.EXTENSION },
    signal,
  })) as Record<CaipAssetType, { price: number }>;

  return Object.entries(tokenV3PriceResponse).reduce(
    (acc, [k, curr]) => {
      acc[k as CaipAssetType] = curr.price;
      return acc;
    },
    {} as Record<CaipAssetType, number>,
  );
};

// This fetches the exchange rate for a token in a given currency. This is only called when the exchange
// rate is not available in the TokenRatesController, which happens when the selected token has not been
// imported into the wallet
export const getTokenExchangeRate = async (request: {
  chainId: Hex | CaipChainId | ChainId;
  tokenAddress: string;
  currency: string;
  signal?: AbortSignal;
}) => {
  const { chainId, tokenAddress, currency, signal } = request;
  const exchangeRates = await fetchTokenExchangeRates(
    chainId,
    currency,
    signal,
    tokenAddress,
  );
  const assetId = toAssetId(tokenAddress, formatChainIdToCaip(chainId));
  return assetId ? exchangeRates?.[assetId] : undefined;
};

// This extracts a token's exchange rate from the marketData state object
// These exchange rates are against the native asset of the chain
export const exchangeRateFromMarketData = (
  chainId: Hex | ChainId | CaipChainId,
  tokenAddress: string,
  marketData?: Record<string, ContractMarketData>,
) =>
  isStrictHexString(tokenAddress) && isStrictHexString(chainId)
    ? marketData?.[chainId]?.[tokenAddress]?.price
    : undefined;

export const tokenAmountToCurrency = (
  amount: string | BigNumber,
  exchangeRate: number,
) =>
  new Numeric(amount, 10)
    // Stringify exchangeRate before applying conversion to avoid floating point issues
    .applyConversionRate(new BigNumber(exchangeRate.toString(), 10))
    .toNumber();

export const tokenPriceInNativeAsset = (
  tokenExchangeRate?: number | null,
  nativeToCurrencyRate?: number | null,
) => {
  return tokenExchangeRate && nativeToCurrencyRate
    ? tokenExchangeRate / nativeToCurrencyRate
    : null;
};

export const exchangeRatesFromNativeAndCurrencyRates = (
  tokenToNativeAssetRate?: number | null,
  nativeToCurrencyRate?: number | null,
  nativeToUsdRate?: number | null,
) => {
  return {
    valueInCurrency:
      tokenToNativeAssetRate && nativeToCurrencyRate
        ? tokenToNativeAssetRate * nativeToCurrencyRate
        : null,
    usd:
      tokenToNativeAssetRate && nativeToUsdRate
        ? tokenToNativeAssetRate * nativeToUsdRate
        : null,
  };
};

export const isNetworkAdded = (
  availableNetworks: { chainId: Hex | CaipChainId }[],
  chainId: Hex | CaipChainId,
) => availableNetworks.some((network) => network.chainId === chainId);

const getTokenImage = (payload: TokenPayload['payload']) => {
  if (!payload) {
    return '';
  }
  const { image, iconUrl, icon, chainId, address, assetId } = payload;
  const caipChainId = formatChainIdToCaip(chainId);
  // If the token is native, return the SVG image asset
  if (isNativeAddress(address)) {
    // Non-EVM chains (Solana, Bitcoin) use MULTICHAIN_TOKEN_IMAGE_MAP
    if (isNonEvmChainId(chainId)) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId];
    }
    // EVM chains use CHAIN_ID_TOKEN_IMAGE_MAP
    return CHAIN_ID_TOKEN_IMAGE_MAP[
      formatChainIdToHex(chainId) as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
    ];
  }
  // If the token is not native, return the image from the payload
  const imageFromPayload = image ?? iconUrl ?? icon;
  if (imageFromPayload) {
    return imageFromPayload;
  }
  // If there's no image from the payload, build the asset image URL and return it
  const assetIdToUse = assetId ?? toAssetId(address, caipChainId);
  return (assetIdToUse && getAssetImageUrl(assetIdToUse, caipChainId)) ?? '';
};

export const toBridgeToken = (
  payload: TokenPayload['payload'],
): BridgeToken => {
  const caipChainId = formatChainIdToCaip(payload.chainId);
  return {
    ...payload,
    name: payload.name ?? payload.symbol,
    balance: payload.balance ?? '0',
    chainId: payload.chainId,
    image: getTokenImage(payload),
    assetId: payload.assetId ?? toAssetId(payload.address, caipChainId),
  };
};
const createBridgeTokenPayload = (
  tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
    assetId?: string;
  },
  chainId: ChainId | Hex | CaipChainId,
): TokenPayload['payload'] | null => {
  const { assetId, ...rest } = tokenData;
  return toBridgeToken({
    ...rest,
    chainId,
  });
};

export const getDefaultToToken = (
  targetChainId: CaipChainId,
  fromToken: Pick<NonNullable<TokenPayload['payload']>, 'address' | 'chainId'>,
) => {
  const commonPair = BRIDGE_CHAINID_COMMON_TOKEN_PAIR[targetChainId];

  if (commonPair) {
    // If bridging from Bitcoin, default to native mainnet token (ETH) instead of common pair token
    if (fromToken.chainId && isBitcoinChainId(fromToken.chainId)) {
      const nativeAsset = getNativeAssetForChainId(targetChainId);
      if (nativeAsset) {
        return createBridgeTokenPayload(nativeAsset, targetChainId);
      }
    }

    // If source is native token, default to common pair token on destination chain
    if (isNativeAddress(fromToken.address)) {
      return createBridgeTokenPayload(commonPair, targetChainId);
    }

    // If source is USDC (or other common pair token), default to native token
    if (fromToken.address?.toLowerCase() === commonPair.address.toLowerCase()) {
      const nativeAsset = getNativeAssetForChainId(targetChainId);
      if (nativeAsset) {
        return createBridgeTokenPayload(nativeAsset, targetChainId);
      }
    }

    // For any other token, default to USDC
    return createBridgeTokenPayload(commonPair, targetChainId);
  }

  // Last resort: native token
  const nativeAsset = getNativeAssetForChainId(targetChainId);
  if (nativeAsset) {
    // return nativeAsset
    return createBridgeTokenPayload(nativeAsset, targetChainId);
  }

  return null;
};
