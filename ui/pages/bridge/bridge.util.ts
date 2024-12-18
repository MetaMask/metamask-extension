import { Contract } from '@ethersproject/contracts';
import { Hex, add0x } from '@metamask/utils';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  BridgeFeatureFlagsKey,
  BridgeFeatureFlags,
  BridgeAsset,
  BridgeFlag,
  FeatureFlagResponse,
  FeeData,
  FeeType,
  Quote,
  QuoteRequest,
  QuoteResponse,
  TxData,
} from '../../../shared/types/bridge';
import {
  BRIDGE_API_BASE_URL,
  BRIDGE_CLIENT_ID,
  ETH_USDT_ADDRESS,
  METABRIDGE_ETHEREUM_ADDRESS,
} from '../../../shared/constants/bridge';
import { MINUTE } from '../../../shared/constants/time';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import {
  decimalToHex,
  hexToDecimal,
} from '../../../shared/modules/conversion.utils';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
} from '../../../shared/constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../shared/modules/swaps.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { REFRESH_INTERVAL_MS } from '../../../app/scripts/controllers/bridge/constants';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  FEATURE_FLAG_VALIDATORS,
  QUOTE_VALIDATORS,
  TX_DATA_VALIDATORS,
  TOKEN_VALIDATORS,
  validateResponse,
  QUOTE_RESPONSE_VALIDATORS,
  FEE_DATA_VALIDATORS,
} from './utils/validators';

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
            [add0x(decimalToHex(chainId))]: value,
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
export async function fetchBridgeQuotes(
  request: QuoteRequest,
  signal: AbortSignal,
): Promise<QuoteResponse[]> {
  const queryParams = new URLSearchParams({
    walletAddress: request.walletAddress,
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

export const isEthUsdt = (chainId: Hex, address: string) =>
  chainId === CHAIN_IDS.MAINNET &&
  address.toLowerCase() === ETH_USDT_ADDRESS.toLowerCase();
