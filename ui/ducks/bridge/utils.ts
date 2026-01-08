import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  parseCaipAssetType,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { ContractMarketData } from '@metamask/assets-controllers';
import {
  ChainId,
  BridgeClientId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
  isBitcoinChainId,
  isNonEvmChainId,
  formatChainIdToHex,
  formatAddressToCaipReference,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../shared/constants/bridge';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
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

const fetchTokenExchangeRates = async (
  currency: string,
  signal?: AbortSignal,
  ...assetIds: CaipAssetType[]
) => {
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
  assetId: CaipAssetType;
  currency: string;
  signal?: AbortSignal;
}) => {
  const { assetId, currency, signal } = request;
  const exchangeRates = await fetchTokenExchangeRates(
    currency,
    signal,
    assetId,
  );
  // EVM prices are lowercased, non-EVM prices are not
  return assetId
    ? (exchangeRates?.[assetId] ??
        exchangeRates?.[assetId.toLowerCase() as CaipAssetType])
    : undefined;
};

// This extracts a token's exchange rate from the marketData state object
// These exchange rates are against the native asset of the chain
export const exchangeRateFromMarketData = (
  assetId: CaipAssetType,
  marketData?: Record<string, ContractMarketData>,
) => {
  const { chainId, assetReference } = parseCaipAssetType(assetId);
  if (isNonEvmChainId(chainId)) {
    return undefined;
  }
  const hexChainId = formatChainIdToHex(chainId);
  const address = formatAddressToCaipReference(assetReference);
  // @ts-expect-error - hexChainId is a Hex string
  return marketData?.[hexChainId]?.[address]?.price ?? undefined;
};

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

export const isNetworkAdded = (
  availableNetworks: { chainId: Hex | CaipChainId }[],
  chainId: Hex | CaipChainId,
) => availableNetworks.some((network) => network.chainId === chainId);

const toAssetIdOrThrow = (chainId: number | string, address = '') => {
  const chainIdInCaip = formatChainIdToCaip(chainId);
  const assetId = toAssetId(address, chainIdInCaip);
  if (!assetId) {
    throw new Error(`Failed to create asset ID for: ${address} on ${chainId}`);
  }
  return assetId;
};

export const toBridgeToken = (
  payload: TokenPayload['payload'],
): BridgeToken => {
  const caipChainId = formatChainIdToCaip(payload.chainId);
  const assetId =
    payload.assetId ?? toAssetIdOrThrow(payload.chainId, payload.address);
  return {
    ...payload,
    name: payload.name ?? payload.symbol,
    balance: payload.balance ?? '0',
    chainId: caipChainId,
    image: (payload.image || getAssetImageUrl(assetId, caipChainId)) ?? '',
    assetId,
    tokenFiatAmount: payload.tokenFiatAmount,
    accountType: payload.accountType,
  };
};
const createBridgeTokenPayload = (
  tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    assetId?: CaipAssetType;
  },
  chainId: ChainId | Hex | CaipChainId,
): TokenPayload['payload'] | null => {
  return toBridgeToken({
    ...tokenData,
    chainId,
  });
};

export const getDefaultToToken = (
  targetChainId: Hex | CaipChainId,
  fromToken: Pick<BridgeToken, 'address' | 'chainId'>,
) => {
  const commonPair =
    BRIDGE_CHAINID_COMMON_TOKEN_PAIR[formatChainIdToCaip(targetChainId)];

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

  throw new Error(
    `No default toToken configured for chainId: ${targetChainId}`,
  );
};
