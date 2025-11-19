import log from 'loglevel';
import {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import { NetworkClientId } from '@metamask/network-controller';
import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';

import { captureException } from '../../../../shared/lib/sentry';
import { getDataFromSwap } from '../../../../shared/modules/dapp-swap-comparison/dapp-swap-comparison-utils';
import { SecurityAlertResponse } from '../ppom/types';

export type DappSwapMiddlewareRequest<
  Params extends JsonRpcParams = JsonRpcParams,
> = Required<JsonRpcRequest<Params>> & {
  origin?: string;
  securityAlertResponse?: SecurityAlertResponse | undefined;
  networkClientId: NetworkClientId;
  params: {
    data: string;
    from: string;
    chainId: string;
    calls: { data: string; from: string }[];
  }[];
};

const FOUR_BYTE_EXECUTE_SWAP_CONTRACT = '0x3593564c';
const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';
const TEST_DAPP_ORIGIN = 'https://metamask.github.io';

const getSwapDetails = (params: DappSwapMiddlewareRequest['params']) => {
  if (!params?.length) {
    return {
      data: undefined,
      from: undefined,
      chainId: undefined,
    };
  }
  const { calls, chainId, data, from } = params[0];
  let transactionData = data;
  if (calls?.length) {
    const executeSwapCall = calls?.find(({ data: trxnData }) =>
      trxnData?.startsWith(FOUR_BYTE_EXECUTE_SWAP_CONTRACT),
    );
    if (executeSwapCall) {
      transactionData = executeSwapCall?.data;
    }
  }
  return {
    chainId,
    data: transactionData,
    from,
  };
};

export function createDappSwapMiddleware<
  Params extends (string | { to: string })[],
  Result extends Json,
>({
  fetchQuotes,
  setSwapQuotes,
}: {
  fetchQuotes: (quotesInput: GenericQuoteRequest) => Promise<QuoteResponse[]>;
  setSwapQuotes: (
    uniqueId: string,
    info: { quotes?: QuoteResponse[]; latency?: number },
  ) => void;
}) {
  return async (
    req: DappSwapMiddlewareRequest<Params>,
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
    try {
      const { securityAlertResponse, params, origin } = req;
      const { securityAlertId } = securityAlertResponse ?? {};

      if (
        origin === DAPP_SWAP_COMPARISON_ORIGIN ||
        origin === TEST_DAPP_ORIGIN
      ) {
        const { data, from, chainId } = getSwapDetails(params);
        if (data && securityAlertId) {
          const { quotesInput } = getDataFromSwap(chainId as Hex, data, from);
          if (quotesInput) {
            const startTime = new Date().getTime();
            fetchQuotes(quotesInput).then((quotes) => {
              const endTime = new Date().getTime();
              const latency = endTime - startTime;
              if (quotes) {
                setSwapQuotes(securityAlertId, { quotes, latency });
              }
            });
          }
        }
      }
    } catch (error) {
      log.error('Error fetching dapp swap quotes', error);
      captureException(error);
    } finally {
      next();
    }
  };
}
