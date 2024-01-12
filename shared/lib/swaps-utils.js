import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { CHAIN_IDS } from '../constants/network';
import {
  GAS_API_BASE_URL,
  GAS_DEV_API_BASE_URL,
  SWAPS_API_V2_BASE_URL,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SWAPS_CLIENT_ID,
  SWAPS_DEV_API_V2_BASE_URL,
  SWAPS_WRAPPED_TOKENS_ADDRESSES,
} from '../constants/swaps';
import { SECOND } from '../constants/time';
import { isValidHexAddress } from '../modules/hexstring-utils';
import { isEqualCaseInsensitive } from '../modules/string-utils';
import { addHexPrefix } from '../../app/scripts/lib/util';
import { decimalToHex } from '../modules/conversion.utils';
import fetchWithCache from './fetch-with-cache';

const TEST_CHAIN_IDS = [CHAIN_IDS.GOERLI, CHAIN_IDS.LOCALHOST];

const clientIdHeader = { 'X-Client-Id': SWAPS_CLIENT_ID };

export const validHex = (string) => Boolean(string?.match(/^0x[a-f0-9]+$/u));
export const truthyString = (string) => Boolean(string?.length);
export const truthyDigitString = (string) =>
  truthyString(string) && Boolean(string.match(/^\d+$/u));

export function validateData(validators, object, urlUsed, logError = true) {
  return validators.every(({ property, type, validator }) => {
    const types = type.split('|');

    const valid =
      types.some((_type) => typeof object[property] === _type) &&
      (!validator || validator(object[property]));
    if (!valid && logError) {
      log.error(
        `response to GET ${urlUsed} invalid for property ${property}; value was:`,
        object[property],
        '| type was: ',
        typeof object[property],
      );
    }
    return valid;
  });
}

export const QUOTE_VALIDATORS = [
  {
    property: 'trade',
    type: 'object',
    validator: (trade) =>
      trade &&
      validHex(trade.data) &&
      isValidHexAddress(trade.to, { allowNonPrefixed: false }) &&
      isValidHexAddress(trade.from, { allowNonPrefixed: false }) &&
      truthyString(trade.value),
  },
  {
    property: 'approvalNeeded',
    type: 'object',
    validator: (approvalTx) =>
      approvalTx === null ||
      (approvalTx &&
        validHex(approvalTx.data) &&
        isValidHexAddress(approvalTx.to, { allowNonPrefixed: false }) &&
        isValidHexAddress(approvalTx.from, { allowNonPrefixed: false })),
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
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'destinationToken',
    type: 'string',
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
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
    validator: (gasEstimate) => gasEstimate === undefined || gasEstimate > 0,
  },
  {
    property: 'fee',
    type: 'number',
  },
];

/**
 * @param {string} type - Type of an API call, e.g. "tokens"
 * @param {string} chainId
 * @returns string
 */
const getBaseUrlForNewSwapsApi = (type, chainId) => {
  const useDevApis = process.env.SWAPS_USE_DEV_APIS;
  const v2ApiBaseUrl = useDevApis
    ? SWAPS_DEV_API_V2_BASE_URL
    : SWAPS_API_V2_BASE_URL;
  const gasApiBaseUrl = useDevApis ? GAS_DEV_API_BASE_URL : GAS_API_BASE_URL;
  const noNetworkSpecificTypes = ['refreshTime']; // These types don't need network info in the URL.
  if (noNetworkSpecificTypes.includes(type)) {
    return v2ApiBaseUrl;
  }
  const chainIdDecimal = chainId && parseInt(chainId, 16);
  const gasApiTypes = ['gasPrices'];
  if (gasApiTypes.includes(type)) {
    return `${gasApiBaseUrl}/networks/${chainIdDecimal}`; // Gas calculations are in its own repo.
  }
  return `${v2ApiBaseUrl}/networks/${chainIdDecimal}`;
};

export const getBaseApi = function (type, chainId) {
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
    case 'network':
      return baseUrl;
    default:
      throw new Error('getBaseApi requires an api call type');
  }
};

export function calcTokenValue(value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).times(multiplier);
}

export const shouldEnableDirectWrapping = (
  chainId,
  sourceToken,
  destinationToken,
) => {
  if (!sourceToken || !destinationToken) {
    return false;
  }
  const wrappedToken = SWAPS_WRAPPED_TOKENS_ADDRESSES[chainId];
  const nativeToken = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.address;
  return (
    (isEqualCaseInsensitive(sourceToken, wrappedToken) &&
      isEqualCaseInsensitive(destinationToken, nativeToken)) ||
    (isEqualCaseInsensitive(sourceToken, nativeToken) &&
      isEqualCaseInsensitive(destinationToken, wrappedToken))
  );
};

/**
 * Given and object where all values are strings, returns the same object with all values
 * now prefixed with '0x'
 *
 * @param obj
 */
export function addHexPrefixToObjectValues(obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: addHexPrefix(obj[key]) };
  }, {});
}

/**
 * Given the standard set of information about a transaction, returns a transaction properly formatted for
 * publishing via JSON RPC and web3
 *
 * @param {object} options
 * @param {boolean} [options.sendToken] - Indicates whether or not the transaction is a token transaction
 * @param {string} options.data - A hex string containing the data to include in the transaction
 * @param {string} options.to - A hex address of the tx recipient address
 * @param options.amount
 * @param {string} options.from - A hex address of the tx sender address
 * @param {string} options.gas - A hex representation of the gas value for the transaction
 * @param {string} options.gasPrice - A hex representation of the gas price for the transaction
 * @returns {object} An object ready for submission to the blockchain, with all values appropriately hex prefixed
 */
export function constructTxParams({
  sendToken,
  data,
  to,
  amount,
  from,
  gas,
  gasPrice,
}) {
  const txParams = {
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
  },
  { chainId },
) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals).toString(10),
    slippage,
    timeout: SECOND * 10,
    walletAddress: fromAddress,
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }
  if (shouldEnableDirectWrapping(chainId, sourceToken, destinationToken)) {
    urlParams.enableDirectWrapping = true;
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi('trade', chainId)}${queryString}`;
  const tradesResponse = await fetchWithCache({
    url: tradeURL,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: 0, timeout: SECOND * 15 },
    functionName: 'fetchTradesInfo',
  });
  const newQuotes = tradesResponse.reduce((aggIdTradeMap, quote) => {
    if (
      quote.trade &&
      !quote.error &&
      validateData(QUOTE_VALIDATORS, quote, tradeURL)
    ) {
      const constructedTrade = constructTxParams({
        to: quote.trade.to,
        from: quote.trade.from,
        data: quote.trade.data,
        amount: decimalToHex(quote.trade.value),
        gas: decimalToHex(quote.maxGas),
      });

      let { approvalNeeded } = quote;

      if (approvalNeeded) {
        approvalNeeded = constructTxParams({
          ...approvalNeeded,
        });
      }

      return {
        ...aggIdTradeMap,
        [quote.aggregator]: {
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
