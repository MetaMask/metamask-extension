import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  parseCaipAssetType,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { ContractMarketData } from '@metamask/assets-controllers';
import {
  BridgeClientId,
  getNativeAssetForChainId,
  isNonEvmChainId,
  formatChainIdToHex,
  formatAddressToCaipReference,
  ChainId,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { Numeric } from '../../../shared/lib/Numeric';
import {
  ALL_ALLOWED_BRIDGE_CHAIN_IDS,
  BRIDGE_CHAINID_COMMON_TOKEN_PAIR,
} from '../../../shared/constants/bridge';
import { getAssetImageUrl } from '../../../shared/lib/asset-utils';
import { BridgeAssetSecurityDataType } from '../../pages/bridge/utils/tokens';
import type { TokenPayload, BridgeToken } from './types';

// Re-export isNonEvmChainId from bridge-controller for backward compatibility
export { isNonEvmChainId as isNonEvmChain } from '@metamask/bridge-controller';

// Re-export isTronChainId from confirmations utils for consistency
export { isTronChainId } from '../../pages/confirmations/utils/network';

/**
 *
 * @param chainId - The chain ID to convert to a hex string
 * @returns The hex string representation of the chain ID. Undefined if the chain ID is not EVM.
 */
export const getMaybeHexChainId = (chainId?: string) => {
  if (!chainId) {
    return undefined;
  }
  return isNonEvmChainId(chainId) ? undefined : formatChainIdToHex(chainId);
};

/**
 * Safely gets the native asset for a given chainId.
 * Returns undefined if the chainId is not supported by the bridge controller.
 * This wrapper prevents errors for custom networks that aren't in the swaps map.
 *
 * @param chainId - The chain ID to get the native asset for
 * @returns The native asset, or undefined if not supported
 */
export const getNativeAssetForChainIdSafe = (
  chainId: string | number | Hex | CaipChainId,
) => {
  try {
    return getNativeAssetForChainId(chainId);
  } catch {
    // Return undefined for unsupported chains (e.g., custom networks, test chains)
    return undefined;
  }
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

export const toBridgeToken = (
  payload: TokenPayload,
  tokenMetadata?: Partial<BridgeToken>,
): BridgeToken => {
  const {
    assetId,
    decimals,
    symbol,
    name,
    balance,
    tokenFiatAmount,
    accountType,
    rwaData,
    isVerified,
    securityData,
  } = payload;
  const { chainId } = parseCaipAssetType(assetId);
  return {
    decimals,
    symbol,
    name: name ?? symbol,
    chainId,
    iconUrl: payload.iconUrl || getAssetImageUrl(assetId, chainId),
    assetId,
    balance: tokenMetadata?.balance ?? balance ?? '0',
    tokenFiatAmount: tokenMetadata?.tokenFiatAmount ?? tokenFiatAmount,
    accountType: tokenMetadata?.accountType ?? accountType,
    rwaData: tokenMetadata?.rwaData ?? rwaData,
    isVerified:
      (tokenMetadata?.securityData?.type ===
        BridgeAssetSecurityDataType.VERIFIED ||
        tokenMetadata?.isVerified) ??
      isVerified,
    securityData: tokenMetadata?.securityData ?? securityData,
  };
};

export const getDefaultToToken = (
  toChainId: CaipChainId,
  fromAssetId: CaipAssetType,
) => {
  const commonPair = BRIDGE_CHAINID_COMMON_TOKEN_PAIR[toChainId];
  // If commonPair is defined and is not the same as the fromToken, return it
  if (
    commonPair &&
    fromAssetId.toLowerCase() !== commonPair.assetId.toLowerCase()
  ) {
    return toBridgeToken(commonPair);
  }

  // Last resort: native token
  return toBridgeToken(getNativeAssetForChainId(toChainId));
};

/**
 * Returns true when the chain is in the set of chains MetaMask supports for
 * bridge/swap, false for any malformed, unknown, or unsupported chain ID.
 *
 * ALL_ALLOWED_BRIDGE_CHAIN_IDS contains chain IDs in three forms:
 * - hex strings      ("0x1", "0xa4b1", …)       from ALLOWED_EVM_BRIDGE_CHAIN_IDS
 * - CAIP strings     ("eip155:1", "solana:…", …) from ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP
 * - numeric ChainId  (1, 1151111081099710, …)     from Object.values(ChainId)
 *
 * getNativeAssetForChainId returns tokens whose chainId is a numeric ChainId enum value
 * (e.g. ChainId.SOLANA = 1151111081099710), so we must check direct inclusion first
 * before attempting any hex conversion — otherwise the numeric value gets converted to an
 * obscure hex string that is absent from the list and the check incorrectly returns false.
 *
 * @param caipChainId - Chain ID to validate in any supported form.
 */
export const isSupportedBridgeChain = (
  caipChainId: string | ChainId,
): boolean => {
  return ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(caipChainId);
};
