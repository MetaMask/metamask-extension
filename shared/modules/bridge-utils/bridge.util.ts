import { Contract } from '@ethersproject/contracts';
import { CaipChainId, type Hex } from '@metamask/utils';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  BRIDGE_API_BASE_URL,
  BRIDGE_CLIENT_ID,
  ETH_USDT_ADDRESS,
  METABRIDGE_ETHEREUM_ADDRESS,
  REFRESH_INTERVAL_MS,
  STATIC_METAMASK_BASE_URL,
} from '../../constants/bridge';
import { MINUTE } from '../../constants/time';
import fetchWithCache from '../../lib/fetch-with-cache';
import { hexToDecimal } from '../conversion.utils';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
  TOKEN_API_BASE_URL,
} from '../../constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../swaps.utils';
import { CHAIN_IDS } from '../../constants/network';
import {
  type BridgeAsset,
  BridgeFlag,
  type FeatureFlagResponse,
  type FeeData,
  type Quote,
  type QuoteResponse,
  type TxData,
  BridgeFeatureFlagsKey,
  type BridgeFeatureFlags,
  type GenericQuoteRequest,
  type TokenV3Asset,
  FeeType,
} from '../../types/bridge';
///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
import { MultichainNetworks } from '../../constants/multichain/networks';
///: END:ONLY_INCLUDE_IF

import {
  formatAddressToString,
  formatChainIdToDec,
  formatChainIdToCaip,
} from './caip-formatters';
import {
  FEATURE_FLAG_VALIDATORS,
  QUOTE_VALIDATORS,
  TX_DATA_VALIDATORS,
  TOKEN_VALIDATORS,
  validateResponse,
  QUOTE_RESPONSE_VALIDATORS,
  FEE_DATA_VALIDATORS,
  ASSET_VALIDATORS,
} from './validators';

const CLIENT_ID_HEADER = { 'X-Client-Id': BRIDGE_CLIENT_ID };
const CACHE_REFRESH_TEN_MINUTES = 10 * MINUTE;

export async function fetchBridgeFeatureFlags(): Promise<BridgeFeatureFlags> {
  const url = `${BRIDGE_API_BASE_URL}/getAllFeatureFlags`;
  const rawFeatureFlags = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_TEN_MINUTES },
    functionName: 'fetchBridgeFeatureFlags',
  });

  if (
    validateResponse<FeatureFlagResponse>(
      FEATURE_FLAG_VALIDATORS,
      rawFeatureFlags,
      url,
    )
  ) {
    return {
      [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
        ...rawFeatureFlags[BridgeFlag.EXTENSION_CONFIG],
        chains: Object.entries(
          rawFeatureFlags[BridgeFlag.EXTENSION_CONFIG].chains,
        ).reduce(
          (acc, [chainId, value]) => ({
            ...acc,
            [formatChainIdToCaip(chainId)]: value,
          }),
          {},
        ),
      },
    };
  }

  return {
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
      refreshRate: REFRESH_INTERVAL_MS,
      maxRefreshCount: 5,
      support: false,
      chains: {},
    },
  };
}

// Returns a list of non-EVM assets
export async function fetchNonEvmTokens(
  chainId: CaipChainId,
): Promise<Record<string, TokenV3Asset>> {
  const url = `${TOKEN_API_BASE_URL}/v3/chains/${chainId}/assets?first=15000`;
  const { data: tokens } = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: 60000 },
    functionName: 'fetchNonEvmTokens',
  });

  const transformedTokens: Record<string, TokenV3Asset> = {};
  tokens.forEach((token: unknown) => {
    if (validateResponse<TokenV3Asset>(ASSET_VALIDATORS, token, url, false)) {
      transformedTokens[token.assetId] = token;
    }
  });
  return transformedTokens;
}

export const isTokenV3Asset = (asset: object): asset is TokenV3Asset => {
  return 'assetId' in asset && typeof asset.assetId === 'string';
};

// Returns the image url for a caip-formatted asset
export const getAssetImageUrl = (assetId: string) =>
  `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/${assetId?.replaceAll(
    ':',
    '/',
  )}.png`;

// Returns a list of enabled (unblocked) tokens
export async function fetchBridgeTokens(
  chainId: Hex,
): Promise<Record<string, SwapsTokenObject>> {
  // TODO make token api v2 call
  const url = `${BRIDGE_API_BASE_URL}/getTokens?chainId=${hexToDecimal(
    chainId,
  )}`;
  const tokens = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_TEN_MINUTES },
    functionName: 'fetchBridgeTokens',
  });

  const nativeToken =
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
      chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
    ];

  const transformedTokens: Record<string, SwapsTokenObject> = {};
  if (nativeToken) {
    transformedTokens[nativeToken.address] = nativeToken;
  }

  tokens.forEach((token: unknown) => {
    if (
      validateResponse<SwapsTokenObject>(TOKEN_VALIDATORS, token, url, false) &&
      !(
        isSwapsDefaultTokenSymbol(token.symbol, chainId) ||
        isSwapsDefaultTokenAddress(token.address, chainId)
      )
    ) {
      transformedTokens[token.address] = token;
    }
  });
  return transformedTokens;
}

// Returns a list of bridge tx quotes
// Converts the quote request to the format the bridge-api expects prior to fetching quotes
export async function fetchBridgeQuotes(
  request: GenericQuoteRequest,
  signal: AbortSignal,
): Promise<QuoteResponse[]> {
  // Ignore slippage for solana swaps
  let ignoreSlippage = false;

  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  ignoreSlippage =
    request.srcChainId === request.destChainId &&
    request.destChainId === MultichainNetworks.SOLANA;
  ///: END:ONLY_INCLUDE_IF

  const normalizedRequest = {
    walletAddress: formatAddressToString(request.walletAddress),
    destWalletAddress: formatAddressToString(
      request.destWalletAddress ?? request.walletAddress,
    ),
    srcChainId: formatChainIdToDec(request.srcChainId).toString(),
    destChainId: formatChainIdToDec(request.destChainId).toString(),
    srcTokenAddress: formatAddressToString(request.srcTokenAddress),
    destTokenAddress: formatAddressToString(request.destTokenAddress),
    srcTokenAmount: request.srcTokenAmount,
    ...(ignoreSlippage ? {} : { slippage: request.slippage.toString() }),
    insufficientBal: request.insufficientBal ? 'true' : 'false',
    resetApproval: request.resetApproval ? 'true' : 'false',
  };
  if (request.slippage !== undefined) {
    normalizedRequest.slippage = request.slippage.toString();
  }
  const queryParams = new URLSearchParams(normalizedRequest);
  const url = `${BRIDGE_API_BASE_URL}/getQuote?${queryParams}`;
  const quotes = await fetchWithCache({
    url,
    fetchOptions: {
      method: 'GET',
      headers: CLIENT_ID_HEADER,
      signal,
    },
    cacheOptions: { cacheRefreshTime: 0 },
    functionName: 'fetchBridgeQuotes',
  });

  const filteredQuotes = quotes.filter((quoteResponse: QuoteResponse) => {
    const { quote, approval, trade } = quoteResponse;
    return (
      validateResponse<QuoteResponse>(
        QUOTE_RESPONSE_VALIDATORS,
        quoteResponse,
        url,
      ) &&
      validateResponse<Quote>(QUOTE_VALIDATORS, quote, url) &&
      validateResponse<BridgeAsset>(TOKEN_VALIDATORS, quote.srcAsset, url) &&
      validateResponse<BridgeAsset>(TOKEN_VALIDATORS, quote.destAsset, url) &&
      (typeof trade === 'string' ||
        validateResponse<TxData>(TX_DATA_VALIDATORS, trade, url)) &&
      validateResponse<FeeData>(
        FEE_DATA_VALIDATORS,
        quote.feeData[FeeType.METABRIDGE],
        url,
      ) &&
      (approval
        ? validateResponse<TxData>(TX_DATA_VALIDATORS, approval, url)
        : true)
    );
  });
  return filteredQuotes;
}
/**
 * A function to return the txParam data for setting allowance to 0 for USDT on Ethereum
 *
 * @returns The txParam data that will reset allowance to 0, combine it with the approval tx params received from Bridge API
 */
export const getEthUsdtResetData = () => {
  const UsdtContractInterface = new Contract(ETH_USDT_ADDRESS, abiERC20)
    .interface;
  const data = UsdtContractInterface.encodeFunctionData('approve', [
    METABRIDGE_ETHEREUM_ADDRESS,
    '0',
  ]);

  return data;
};

export const isEthUsdt = (chainId: Hex, address: string) =>
  chainId === CHAIN_IDS.MAINNET &&
  address.toLowerCase() === ETH_USDT_ADDRESS.toLowerCase();
