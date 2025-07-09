import { isNumber } from 'lodash';
import {
  ALLOWED_PROD_SWAPS_CHAIN_IDS,
  SWAPS_API_V2_BASE_URL,
  SWAPS_CLIENT_ID,
  SWAPS_DEV_API_V2_BASE_URL,
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
import {
  decimalToHex,
  hexToDecimal,
} from '../../../shared/modules/conversion.utils';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import {
  fetchSwapsFeatureFlags,
  getNetworkNameByChainId,
} from '../../pages/swaps/swaps.util';

type Address = `0x${string}`;

export type Request = {
  chainId: number; // chain ID as decimal
  sourceAmount: string; // big number string
  sourceToken: Address;
  destinationToken: Address;
  sender: Address;
  recipient: Address;
  slippage?: string; // slippage as a percentage; e.g. '1.0' for 1%
};

export type Quote = {
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
    gas?: string;
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
  // added on later
  adjustAmountReceivedInNative?: number;
};

const QUOTE_VALIDATORS = [
  {
    property: 'gasParams',
    type: 'object',
    validator: (gasParams: Record<string, number>) =>
      gasParams && isNumber(gasParams.maxGas),
  },
  {
    property: 'trade',
    type: 'object',
    validator: (trade: Record<string, string>) =>
      trade &&
      validHex(trade.data) &&
      isValidHexAddress(trade.to, { allowNonPrefixed: false }) &&
      isValidHexAddress(trade.from, { allowNonPrefixed: false }) &&
      truthyString(trade.value),
  },
  {
    property: 'approvalNeeded',
    type: 'object',
    validator: (approvalTx: Record<string, string>) =>
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
    validator: (error: unknown) => error === null || typeof error === 'object',
  },
  {
    property: 'fee',
    type: 'number',
  },
];

const SWAP_AND_SEND_SLIPPAGE = '2';

const SWAPS_API_VERSION = 'v2';

const BASE_URL = process.env.SWAPS_USE_DEV_APIS
  ? SWAPS_DEV_API_V2_BASE_URL
  : SWAPS_API_V2_BASE_URL;

export async function getSwapAndSendQuotes(request: Request): Promise<Quote[]> {
  const { chainId, ...params } = request;

  params.slippage = params.slippage ?? SWAP_AND_SEND_SLIPPAGE;

  const queryString = new URLSearchParams(params);

  const url = `${BASE_URL}/${SWAPS_API_VERSION}/networks/${hexToDecimal(
    chainId,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  )}/quotes?${queryString}`;

  const tradesResponse = await fetchWithCache({
    url,
    fetchOptions: {
      method: 'GET',
      headers: { 'X-Client-Id': SWAPS_CLIENT_ID },
    },
    cacheOptions: { cacheRefreshTime: 0, timeout: SECOND * 15 },
    functionName: 'getSwapAndSendQuotes',
  });

  const newQuotes = tradesResponse
    .map((quote: Quote) => {
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
          gas: decimalToHex(quote.gasParams.maxGas),
        });

        let { approvalNeeded } = quote;

        if (approvalNeeded) {
          approvalNeeded = addHexPrefixToObjectValues(
            approvalNeeded,
          ) as Quote['approvalNeeded'];
        }

        return {
          ...quote,
          slippage: params.slippage,
          trade: constructedTrade,
          approvalNeeded,
        };
      }
      return undefined;
    })
    .filter(Boolean);

  return newQuotes;
}

export async function getDisabledSwapAndSendNetworksFromAPI(): Promise<
  string[]
> {
  try {
    const blockedChains: string[] = [];

    const featureFlagResponse = await fetchSwapsFeatureFlags();

    ALLOWED_PROD_SWAPS_CHAIN_IDS.forEach((chainId) => {
      // explicitly look for disabled so that chains aren't turned off accidentally
      if (
        featureFlagResponse[getNetworkNameByChainId(chainId)]?.v2?.swapAndSend
          ?.enabled === false
      ) {
        blockedChains.push(chainId);
      }
    });

    return blockedChains;
  } catch (error) {
    // assume no networks are blocked since the quotes will not be fetched on an unavailable network anyways
    return [];
  }
}
