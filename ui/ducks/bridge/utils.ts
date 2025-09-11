import {
  type CaipAssetType,
  isStrictHexString,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { ContractMarketData } from '@metamask/assets-controllers';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import {
  ChainId,
  type TxData,
  BridgeClientId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
  isSolanaChainId,
  formatChainIdToHex,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../shared/constants/bridge';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import {
  MULTICHAIN_TOKEN_IMAGE_MAP,
  MultichainNetworks,
} from '../../../shared/constants/multichain/networks';
import type { TokenPayload, BridgeToken } from './types';

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
  v:
    | NetworkConfiguration
    | AddNetworkFields
    | (Omit<NetworkConfiguration, 'chainId'> & { chainId: CaipChainId })
    | undefined,
): v is NetworkConfiguration =>
  v !== undefined &&
  'networkClientId' in v.rpcEndpoints[v.defaultRpcEndpointIndex];

const getTokenImage = (payload: TokenPayload['payload']) => {
  if (!payload) {
    return '';
  }
  const { image, iconUrl, icon, chainId, address, assetId } = payload;
  const caipChainId = formatChainIdToCaip(chainId);
  // If the token is native, return the SVG image asset
  if (isNativeAddress(address)) {
    if (isSolanaChainId(chainId)) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId];
    }
    // Check if it's Bitcoin chain ID
    if (
      [
        MultichainNetworks.BITCOIN,
        MultichainNetworks.BITCOIN_TESTNET,
        MultichainNetworks.BITCOIN_SIGNET,
      ].includes(chainId as MultichainNetworks)
    ) {
      return MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId];
    }
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
): BridgeToken | null => {
  if (!payload) {
    return null;
  }
  const caipChainId = formatChainIdToCaip(payload.chainId);
  return {
    ...payload,
    balance: payload.balance ?? '0',
    string: payload.string ?? '0',
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
  chainId: ChainId | Hex,
): TokenPayload['payload'] | null => {
  const { assetId, ...rest } = tokenData;
  return toBridgeToken({
    ...rest,
    chainId,
  });
};

export const getDefaultToToken = (
  { chainId: targetChainId }: NetworkConfiguration | AddNetworkFields,
  fromToken: NonNullable<TokenPayload['payload']>,
) => {
  const commonPair =
    BRIDGE_CHAINID_COMMON_TOKEN_PAIR[
      targetChainId as keyof typeof BRIDGE_CHAINID_COMMON_TOKEN_PAIR
    ];

  if (commonPair) {
    // If source is native token, default to USDC on same chain
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
