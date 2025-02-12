import { Contract } from '@ethersproject/contracts';
import { isCaipChainId, type Hex, type CaipChainId } from '@metamask/utils';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  BRIDGE_API_BASE_URL,
  BRIDGE_CLIENT_ID,
  ETH_USDT_ADDRESS,
  METABRIDGE_ETHEREUM_ADDRESS,
  REFRESH_INTERVAL_MS,
} from '../../constants/bridge';
import { MINUTE } from '../../constants/time';
import fetchWithCache from '../../lib/fetch-with-cache';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
} from '../../constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../swaps.utils';
import { CHAIN_IDS } from '../../constants/network';
import {
  BridgeAsset,
  BridgeFlag,
  FeatureFlagResponse,
  FeeData,
  FeeType,
  Quote,
  QuoteRequest,
  QuoteResponse,
  TxData,
  BridgeFeatureFlagsKey,
  BridgeFeatureFlags,
} from '../../types/bridge';
import {
  FEATURE_FLAG_VALIDATORS,
  QUOTE_VALIDATORS,
  TX_DATA_VALIDATORS,
  TOKEN_VALIDATORS,
  validateResponse,
  QUOTE_RESPONSE_VALIDATORS,
  FEE_DATA_VALIDATORS,
} from './validators';
import { formatChainIdFromDecimal, formatChainIdToDecimal } from './multichain';

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
            [formatChainIdFromDecimal(chainId)]: value,
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

// Returns a list of enabled (unblocked) tokens
export async function fetchBridgeTokens(
  chainId: Hex | CaipChainId,
): Promise<Record<string, SwapsTokenObject>> {
  const transformedTokens: Record<string, SwapsTokenObject> = {};
  const nativeToken =
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
      chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
    ];
  if (nativeToken) {
    transformedTokens[nativeToken.address] = nativeToken;
  }

  if (isCaipChainId(chainId)) {
    // TODO call token endpoint for solana
    return transformedTokens;
  }

  // TODO make token api v2 call
  const url = `${BRIDGE_API_BASE_URL}/getTokens?chainId=${formatChainIdToDecimal(
    chainId,
  )}`;
  const tokens = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_TEN_MINUTES },
    functionName: 'fetchBridgeTokens',
  });

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
export async function fetchBridgeQuotes(
  request: QuoteRequest,
  signal: AbortSignal,
): Promise<QuoteResponse[]> {
  const queryParams = new URLSearchParams({
    walletAddress: request.walletAddress,
    destWalletAddress: request.destWalletAddress ?? request.walletAddress,
    srcChainId: request.srcChainId.toString(),
    destChainId: request.destChainId.toString(),
    srcTokenAddress: request.srcTokenAddress,
    destTokenAddress: request.destTokenAddress,
    srcTokenAmount: request.srcTokenAmount,
    slippage: request.slippage.toString(),
    insufficientBal: request.insufficientBal ? 'true' : 'false',
    resetApproval: request.resetApproval ? 'true' : 'false',
  });
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
      validateResponse<TxData>(TX_DATA_VALIDATORS, trade, url) &&
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

export const isEthUsdt = (chainId: Hex | CaipChainId, address: string) =>
  isCaipChainId(chainId)
    ? false
    : chainId === CHAIN_IDS.MAINNET &&
      address.toLowerCase() === ETH_USDT_ADDRESS.toLowerCase();
