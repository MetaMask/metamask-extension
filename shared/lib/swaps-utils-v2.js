import { CHAIN_IDS } from '../constants/network';
import { SECOND } from '../constants/time';
import { isValidHexAddress } from '../modules/hexstring-utils';
import { decimalToHex } from '../modules/conversion.utils';
import fetchWithCache from './fetch-with-cache';
import {
  TEST_CHAIN_IDS,
  calcTokenValue,
  clientIdHeader,
  constructTxParams,
  getBaseUrlForNewSwapsApi,
  shouldEnableDirectWrapping,
  truthyDigitString,
  truthyString,
  validHex,
  validateData,
} from './swaps-utils';

export const QUOTE_VALIDATORS_V2 = [
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
        isValidHexAddress(approvalTx.from, { allowNonPrefixed: false }) &&
        truthyDigitString(approvalTx.value)),
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
    property: 'buyToken',
    type: 'string',
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'sellToken',
    type: 'string',
    validator: (input) => isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'aggregator',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'aggregatorType',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'error',
    type: 'object',
    validator: (error) => error === null || typeof error === 'object',
  },
  {
    property: 'gasParams',
    type: 'object',
    validator: (gasParams) =>
      gasParams &&
      typeof gasParams.averageGas === 'number' &&
      typeof gasParams.estimatedRefund === 'number' &&
      typeof gasParams.maxGas === 'number' &&
      typeof gasParams.gasMultiplier === 'number',
  },
  {
    property: 'fee',
    type: 'number',
  },
  {
    property: 'priceSlippage',
    type: 'object',
    validator: (priceSlippage) =>
      priceSlippage &&
      (priceSlippage.ratio === null ||
        typeof priceSlippage.ratio === 'number') &&
      (priceSlippage.calculationError === null ||
        typeof priceSlippage.calculationError === 'string') &&
      (priceSlippage.bucket === null ||
        typeof priceSlippage.bucket === 'string') &&
      (priceSlippage.sourceAmountInUSD === null ||
        typeof priceSlippage.sourceAmountInUSD === 'number') &&
      (priceSlippage.destinationAmountInUSD === null ||
        typeof priceSlippage.destinationAmountInUSD === 'number') &&
      (priceSlippage.sourceAmountInNativeCurrency === null ||
        typeof priceSlippage.sourceAmountInNativeCurrency === 'number') &&
      (priceSlippage.destinationAmountInNativeCurrency === null ||
        typeof priceSlippage.destinationAmountInNativeCurrency === 'number') &&
      (priceSlippage.sourceAmountInETH === null ||
        typeof priceSlippage.sourceAmountInETH === 'number') &&
      (priceSlippage.destinationAmountInETH === null ||
        typeof priceSlippage.destinationAmountInETH === 'number'),
  },
];

export const getBaseApi = function (type, chainId) {
  const _chainId = TEST_CHAIN_IDS.includes(chainId)
    ? CHAIN_IDS.MAINNET
    : chainId;
  const baseUrl = getBaseUrlForNewSwapsApi(type, _chainId);
  if (!baseUrl) {
    throw new Error(`Swaps API calls are disabled for chainId: ${_chainId}`);
  }

  // For quote only in local dev
  // TODO remove this once we have a production api
  const chainIdDecimal = chainId && parseInt(chainId, 16);
  const localUrl = `http://localhost:4000/v2/networks/${chainIdDecimal}`;

  switch (type) {
    case 'quote':
      return `${localUrl}/quotes?`;
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

export async function fetchQuotesInfoV2(
  {
    slippage,
    sourceToken,
    sourceDecimals,
    destinationToken,
    value,
    fromAddress,
    toAddress,
    exchangeList,
  },
  { chainId },
) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals).toString(10),
    slippage,
    // timeout: SECOND * 10, // v2 api doesn't like this
    sender: fromAddress,
    recipient: toAddress,
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }
  if (shouldEnableDirectWrapping(chainId, sourceToken, destinationToken)) {
    urlParams.enableDirectWrapping = true;
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi('quote', chainId)}${queryString}`;

  console.log('tradeURL', tradeURL);

  const tradesResponse = await fetchWithCache({
    url: tradeURL,
    fetchOptions: { method: 'GET', headers: clientIdHeader },
    cacheOptions: { cacheRefreshTime: 0, timeout: SECOND * 15 },
    functionName: 'fetchQuotesInfoV2',
  });
  const newQuotes = tradesResponse.reduce((aggIdTradeMap, quote) => {
    if (
      quote.trade &&
      !quote.error &&
      validateData(QUOTE_VALIDATORS_V2, quote, tradeURL)
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
