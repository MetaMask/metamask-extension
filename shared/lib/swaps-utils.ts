import BigNumber from 'bignumber.js';
import log from 'loglevel';
import {
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '@metamask/bridge-controller';
import { CHAIN_IDS } from '../constants/network';
import {
  GAS_API_BASE_URL,
  GAS_DEV_API_BASE_URL,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SWAPS_CLIENT_ID,
  SWAPS_WRAPPED_TOKENS_ADDRESSES,
  TOKEN_API_BASE_URL,
} from '../constants/swaps';
import { SECOND } from '../constants/time';
import { addHexPrefix } from './add-hex-prefix';
import { isValidHexAddress } from './hexstring-utils';
import { isEqualCaseInsensitive } from './string-utils';
import { decimalToHex } from './conversion.utils';
import fetchWithCache from './fetch-with-cache';

const FALLBACK_GAS_MULTIPLIER = 1.5;

const TEST_CHAIN_IDS: string[] = [CHAIN_IDS.GOERLI, CHAIN_IDS.LOCALHOST];

const clientIdHeader = { 'X-Client-Id': SWAPS_CLIENT_ID };

export type SwapsApiCallType =
  | 'trade'
  | 'tokens'
  | 'token'
  | 'topAssets'
  | 'aggregatorMetadata'
  | 'gasPrices'
  | 'blockedTokens'
  | 'network'
  | 'refreshTime';

export type SwapsQuoteValidator = {
  property: string;
  type: string;
  validator?: (value: unknown) => boolean;
};

type SwapsTradeTxFields = {
  data?: string;
  to?: string;
  from?: string;
  value?: string;
};

type SwapsTradeQuoteResponse = {
  trade?: SwapsTradeTxFields;
  approvalNeeded?: SwapsTradeTxFields | null;
  error?: unknown;
  aggregator?: string;
  maxGas?: number;
  slippage?: string;
  [key: string]: unknown;
};

type ConstructTxParamsInput = {
  sendToken?: boolean;
  data?: string;
  to?: string;
  amount?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
};

type FetchTradesInfoInput = {
  slippage: string;
  sourceToken: string;
  sourceDecimals: number;
  destinationToken: string;
  value: string;
  fromAddress: string;
  exchangeList?: string;
  enableGasIncludedQuotes?: boolean;
};

export const validHex = (string: string | undefined): boolean =>
  Boolean(string?.match(/^0x[a-f0-9]+$/u));
export const truthyString = (string: string | undefined): boolean =>
  Boolean(string?.length);
export const truthyDigitString = (string: string | undefined): boolean =>
  truthyString(string) && Boolean(string.match(/^\d+$/u));

export function validateData(
  validators: SwapsQuoteValidator[],
  object: Record<string, unknown>,
  urlUsed: string,
  logError = true,
): boolean {
  return validators.every(({ property, type, validator }) => {
    const types = type.split('|');

    const propertyValue = object[property];
    const valid =
      types.some((_type) => typeof propertyValue === _type) &&
      (!validator || validator(propertyValue));
    if (!valid && logError) {
      log.error(
        `response to GET ${urlUsed} invalid for property ${property}; value was:`,
        propertyValue,
        '| type was: ',
        typeof propertyValue,
      );
    }
    return valid;
  });
}

export const QUOTE_VALIDATORS: SwapsQuoteValidator[] = [
  {
    property: 'trade',
    type: 'object',
    validator: (trade) => {
      const tradeObj = trade as SwapsTradeTxFields | null | undefined;
      return Boolean(
        tradeObj &&
        validHex(tradeObj.data) &&
        isValidHexAddress(tradeObj.to, { allowNonPrefixed: false }) &&
        isValidHexAddress(tradeObj.from, { allowNonPrefixed: false }) &&
        truthyString(tradeObj.value),
      );
    },
  },
  {
    property: 'approvalNeeded',
    type: 'object',
    validator: (approvalTx) => {
      const approval = approvalTx as SwapsTradeTxFields | null | undefined;
      return (
        approvalTx === null ||
        Boolean(
          approval &&
          validHex(approval.data) &&
          isValidHexAddress(approval.to, { allowNonPrefixed: false }) &&
          isValidHexAddress(approval.from, { allowNonPrefixed: false }),
        )
      );
    },
  },
  {
    property: 'sourceAmount',
    type: 'string',
    validator: truthyDigitString,
  },
  {
    property: 'destinationAmount',
    type: 'string',
    validator: truthyDigitString,
  },
  {
    property: 'sourceToken',
    type: 'string',
    validator: (input) =>
      isValidHexAddress(String(input), { allowNonPrefixed: false }),
  },
  {
    property: 'destinationToken',
    type: 'string',
    validator: (input) =>
      isValidHexAddress(String(input), { allowNonPrefixed: false }),
  },
  {
    property: 'aggregator',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'aggType',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'error',
    type: 'object',
    validator: (error) => error === null || typeof error === 'object',
  },
  {
    property: 'averageGas',
    type: 'number',
  },
  {
    property: 'maxGas',
    type: 'number',
  },
  {
    property: 'gasEstimate',
    type: 'number|undefined',
    validator: (gasEstimate) =>
      gasEstimate === undefined ||
      (typeof gasEstimate === 'number' && gasEstimate > 0),
  },
  {
    property: 'fee',
    type: 'number',
  },
];

const getBaseUrlForNewSwapsApi = (
  type: SwapsApiCallType,
  chainId?: string,
): string | undefined => {
  const useDevApis = process.env.SWAPS_USE_DEV_APIS;
  const v2ApiBaseUrl = useDevApis
    ? BRIDGE_DEV_API_BASE_URL
    : BRIDGE_PROD_API_BASE_URL;
  const gasApiBaseUrl = useDevApis ? GAS_DEV_API_BASE_URL : GAS_API_BASE_URL;
  const tokenApiBaseUrl = TOKEN_API_BASE_URL;
  const noNetworkSpecificTypes: SwapsApiCallType[] = ['refreshTime'];
  if (noNetworkSpecificTypes.includes(type)) {
    return v2ApiBaseUrl;
  }
  const chainIdDecimal = chainId && parseInt(chainId, 16);
  if (chainIdDecimal === undefined || Number.isNaN(chainIdDecimal)) {
    return undefined;
  }
  const gasApiTypes: SwapsApiCallType[] = ['gasPrices'];
  if (gasApiTypes.includes(type)) {
    return `${gasApiBaseUrl}/networks/${chainIdDecimal}`;
  }
  const tokenApiTypes: SwapsApiCallType[] = ['blockedTokens'];
  if (tokenApiTypes.includes(type)) {
    return `${tokenApiBaseUrl}/blocklist?chainId=${chainIdDecimal}`;
  }
  return `${v2ApiBaseUrl}/networks/${chainIdDecimal}`;
};

export const getBaseApi = function getBaseApi(
  type: SwapsApiCallType,
  chainId: string,
): string {
  const _chainId = TEST_CHAIN_IDS.includes(chainId)
    ? CHAIN_IDS.MAINNET
    : chainId;
  const baseUrl = getBaseUrlForNewSwapsApi(type, _chainId);
  if (!baseUrl) {
    throw new Error(`Swaps API calls are disabled for chainId: ${_chainId}`);
  }
  switch (type) {
    case 'trade':
      return `${baseUrl}/trades?`;
    case 'tokens':
      return `${baseUrl}/tokens?includeBlockedTokens=true`;
    case 'token':
      return `${baseUrl}/token`;
    case 'topAssets':
      return `${baseUrl}/topAssets`;
    case 'aggregatorMetadata':
      return `${baseUrl}/aggregatorMetadata`;
    case 'gasPrices':
      return `${baseUrl}/gasPrices`;
    case 'blockedTokens':
      return `${baseUrl}&region=global`;
    case 'network':
      return baseUrl;
    default:
      throw new Error('getBaseApi requires an api call type');
  }
};

export function calcTokenValue(value: number | string, decimals: number) {
  const multiplier = new BigNumber(10).pow(new BigNumber(decimals));
  return new BigNumber(String(value)).times(multiplier);
}

type SwapsWrappedTokensChainId = keyof typeof SWAPS_WRAPPED_TOKENS_ADDRESSES;

export const shouldEnableDirectWrapping = (
  chainId: string,
  sourceToken?: string,
  destinationToken?: string,
): boolean => {
  if (!sourceToken || !destinationToken) {
    return false;
  }
  const wrappedToken =
    SWAPS_WRAPPED_TOKENS_ADDRESSES[chainId as SwapsWrappedTokensChainId];
  const nativeToken = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.address;
  return (
    (isEqualCaseInsensitive(sourceToken, wrappedToken) &&
      isEqualCaseInsensitive(destinationToken, nativeToken)) ||
    (isEqualCaseInsensitive(sourceToken, nativeToken) &&
      isEqualCaseInsensitive(destinationToken, wrappedToken))
  );
};

export function addHexPrefixToObjectValues(
  obj: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return Object.keys(obj).reduce<Record<string, string | undefined>>(
    (newObj, key) => {
      const value = obj[key];
      return {
        ...newObj,
        [key]: value === undefined ? undefined : addHexPrefix(value),
      };
    },
    {},
  );
}

export function constructTxParams({
  sendToken,
  data,
  to,
  amount,
  from,
  gas,
  gasPrice,
}: ConstructTxParamsInput) {
  const txParams: Record<string, string | undefined> = {
    data,
    from,
    value: '0',
    gas,
    gasPrice,
  };

  if (!sendToken) {
    txParams.value = amount;
    txParams.to = to;
  }
  return addHexPrefixToObjectValues(txParams);
}

export async function fetchTradesInfo(
  {
    slippage,
    sourceToken,
    sourceDecimals,
    destinationToken,
    value,
    fromAddress,
    exchangeList,
    enableGasIncludedQuotes,
  }: FetchTradesInfoInput,
  { chainId }: { chainId: string },
) {
  const urlParams: Record<string, string | boolean | number> = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals).toString(10),
    slippage,
    timeout: SECOND * 10,
    walletAddress: fromAddress,
    enableGasIncludedQuotes: Boolean(enableGasIncludedQuotes),
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }
  if (shouldEnableDirectWrapping(chainId, sourceToken, destinationToken)) {
    urlParams.enableDirectWrapping = 'true';
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi('trade', chainId)}${queryString}`;
  const tradesResponse = (await fetchWithCache({
    url: tradeURL,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: 0, timeout: SECOND * 15 },
    functionName: 'fetchTradesInfo',
  })) as SwapsTradeQuoteResponse[];

  const newQuotes = tradesResponse.reduce<
    Record<string, SwapsTradeQuoteResponse>
  >((aggIdTradeMap, quote) => {
    if (
      quote.trade &&
      !quote.error &&
      validateData(QUOTE_VALIDATORS, quote as Record<string, unknown>, tradeURL)
    ) {
      const constructedTrade = constructTxParams({
        to: quote.trade.to,
        from: quote.trade.from,
        data: quote.trade.data,
        amount: decimalToHex(quote.trade.value ?? '0'),
        gas: decimalToHex(String(quote.maxGas ?? 0)),
      });

      let { approvalNeeded } = quote;

      if (approvalNeeded) {
        approvalNeeded = constructTxParams({
          ...approvalNeeded,
        });
      }

      return {
        ...aggIdTradeMap,
        [quote.aggregator as string]: {
          ...quote,
          slippage,
          trade: constructedTrade,
          approvalNeeded,
        },
      };
    }
    return aggIdTradeMap;
  }, {});

  return newQuotes;
}

export function calculateMaxGasLimit(
  gasEstimate: string | undefined,
  gasMultiplier: number = FALLBACK_GAS_MULTIPLIER,
  maxGas?: number,
  customMaxGas?: string,
): string {
  const gasLimitForMax = new BigNumber(gasEstimate || 0, 16)
    .round(0)
    .toString(16);

  const usedGasLimitWithMultiplier = new BigNumber(gasLimitForMax, 16)
    .times(gasMultiplier, 10)
    .round(0)
    .toString(16);

  const nonCustomMaxGasLimit = gasEstimate
    ? usedGasLimitWithMultiplier
    : `0x${decimalToHex(maxGas || 0)}`;
  const maxGasLimit = customMaxGas || nonCustomMaxGasLimit;

  return maxGasLimit;
}
