import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../constants/swaps';

import { calcTokenValue } from '../../ui/app/helpers/utils/token-util';
import { constructTxParams } from '../../ui/app/helpers/utils/util';
import { decimalToHex } from '../../ui/app/helpers/utils/conversions.util';

import fetchWithCache from '../../ui/app/helpers/utils/fetch-with-cache';
import {
  getBaseApi,
  validateData,
  QUOTE_VALIDATORS,
} from '../../ui/app/pages/swaps/swaps.util';

/**
 * Checks whether the provided address is strictly equal to the address for
 * the default swaps token of the provided chain.
 *
 * @param {string} address - The string to compare to the default token address
 * @param {string} chainId - The hex encoded chain ID of the default swaps token to check
 * @returns {boolean} Whether the address is the provided chain's default token address
 */
export function isSwapsDefaultTokenAddress(address, chainId) {
  if (!address || !chainId) {
    return false;
  }

  return address === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.address;
}

/**
 * Checks whether the provided symbol is strictly equal to the symbol for
 * the default swaps token of the provided chain.
 *
 * @param {string} symbol - The string to compare to the default token symbol
 * @param {string} chainId - The hex encoded chain ID of the default swaps token to check
 * @returns {boolean} Whether the symbl is the provided chain's default token symbol
 */
export function isSwapsDefaultTokenSymbol(symbol, chainId) {
  if (!symbol || !chainId) {
    return false;
  }

  return symbol === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.symbol;
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
    timeout: 10000,
    walletAddress: fromAddress,
  };

  if (exchangeList) {
    urlParams.exchangeList = exchangeList;
  }

  const queryString = new URLSearchParams(urlParams).toString();
  const tradeURL = `${getBaseApi('trade', chainId)}${queryString}`;
  console.log('tradeURL', tradeURL)
  const tradesResponse = await fetchWithCache(
    tradeURL,
    { method: 'GET' },
    { cacheRefreshTime: 0, timeout: 15000 },
  );
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

export async function fetchSwapsFeatureLiveness(chainId) {
  const status = await fetchWithCache(
    getBaseApi('featureFlag', chainId),
    { method: 'GET' },
    { cacheRefreshTime: 600000 },
  );
  return status?.active;
}

export async function fetchSwapsQuoteRefreshTime(chainId) {
  const response = await fetchWithCache(
    getBaseApi('refreshTime', chainId),
    { method: 'GET' },
    { cacheRefreshTime: 600000 },
  );

  // We presently use milliseconds in the UI
  if (typeof response?.seconds === 'number' && response.seconds > 0) {
    return response.seconds * 1000;
  }

  throw new Error(
    `MetaMask - refreshTime provided invalid response: ${response}`,
  );
}
