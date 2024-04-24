import { isNumber } from 'lodash';
import {
  SWAPS_API_V2_BASE_URL,
  SWAPS_CLIENT_ID,
} from '../../../shared/constants/swaps';
import { SECOND } from '../../../shared/constants/time';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import {
  addHexPrefixToObjectValues,
  truthyDigitString,
  truthyString,
  validHex,
  validateData,
} from '../../../shared/lib/swaps-utils';
import { decimalToHex } from '../../../shared/modules/conversion.utils';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';

type Address = `0x${string}`;

type Request = {
  chainId: number; // chain ID as decimal
  sourceAmount: string; // big number string
  sourceToken: Address;
  destinationToken: Address;
  sender: Address;
  recipient: Address;
  slippage: Address; // slippage as a percentage; e.g. '1.0' for 1%
};

type Quote = {
  gasParams: {
    maxGas: number;
  };
  trade: {
    data: string;
    to: string;
    from: string;
    value: string;
  };
  approvalNeeded: null | {
    data: string;
    to: string;
    from: string;
  };
  sourceAmount: string;
  destinationAmount: string;
  sourceToken: string;
  destinationToken: string;
  sender: string;
  recipient: string;
  aggregator: string;
  aggregatorType: string;
  error: null | object;
  fee: number;
};

const QUOTE_VALIDATORS = [
  {
    property: 'gasParams',
    type: 'object',
    validator: (gasParams: Record<string, any>) =>
      gasParams && isNumber(gasParams.maxGas),
  },
  {
    property: 'trade',
    type: 'object',
    validator: (trade: Record<string, any>) =>
      trade &&
      validHex(trade.data) &&
      isValidHexAddress(trade.to, { allowNonPrefixed: false }) &&
      isValidHexAddress(trade.from, { allowNonPrefixed: false }) &&
      truthyString(trade.value),
  },
  {
    property: 'approvalNeeded',
    type: 'object',
    validator: (approvalTx: Record<string, any>) =>
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
    validator: (input: string) =>
      isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'destinationToken',
    type: 'string',
    validator: (input: string) =>
      isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'sender',
    type: 'string',
    validator: (input: string) =>
      isValidHexAddress(input, { allowNonPrefixed: false }),
  },
  {
    property: 'recipient',
    type: 'string',
    validator: (input: string) =>
      isValidHexAddress(input, { allowNonPrefixed: false }),
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
    validator: (error: any) => error === null || typeof error === 'object',
  },
  {
    property: 'fee',
    type: 'number',
  },
];
const SWAPS_API_VERSION = 'v2';

export async function getSwapAndSendQuotes(
  request: Request,
): Promise<Record<string, Quote>> {
  const { chainId, ...params } = request;

  const queryString = new URLSearchParams(params);

  // FIXME: can't use the dev API since it's several major versions behind prod
  const url = `${SWAPS_API_V2_BASE_URL}/${SWAPS_API_VERSION}/networks/${chainId}/quotes?${queryString}`;

  const tradesResponse = await fetchWithCache({
    url,
    fetchOptions: {
      method: 'GET',
      headers: { 'X-Client-Id': SWAPS_CLIENT_ID },
    },
    cacheOptions: { cacheRefreshTime: 0, timeout: SECOND * 15 },
    functionName: 'getSwapAndSendQuotes',
  });

  const newQuotes = tradesResponse.reduce(
    (aggIdTradeMap: Record<string, Quote>, quote: Quote) => {
      if (
        quote.trade &&
        !quote.error &&
        validateData(QUOTE_VALIDATORS, quote, url)
      ) {
        const constructedTrade = addHexPrefixToObjectValues({
          to: quote.trade.to,
          from: quote.trade.from,
          data: quote.trade.data,
          value: decimalToHex(quote.trade.value),
          // bang is safe because we've validated the presence of this property
          gas: decimalToHex(quote.gasParams.maxGas),
        });

        let { approvalNeeded } = quote;

        if (approvalNeeded) {
          approvalNeeded = addHexPrefixToObjectValues(approvalNeeded) as any;
        }

        return {
          ...aggIdTradeMap,
          [quote.aggregator]: {
            ...quote,
            slippage: params.slippage,
            trade: constructedTrade,
            approvalNeeded,
          },
        };
      }
      return aggIdTradeMap;
    },
    {},
  );

  return newQuotes;
}
