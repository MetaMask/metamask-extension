import log from 'loglevel';
import { Hex, JsonRpcParams } from '@metamask/utils';
import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';

import { captureException } from '../../../../shared/lib/sentry';
import { getDataFromSwap } from '../../../../shared/modules/dapp-swap-comparison/dapp-swap-comparison-utils';
import { DappSwapMiddlewareRequest } from './dapp-swap-middleware';

const FOUR_BYTE_EXECUTE_SWAP_CONTRACT = '0x3593564c';
const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';
const TEST_DAPP_ORIGIN = 'https://metamask.github.io';
const DEFAULT_QUOTEFEE = 250;

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

export function getQuotesForConfirmation({
  req,
  fetchQuotes,
  setSwapQuotes,
  dappSwapMetricsFlag,
  securityAlertId,
}: {
  req: DappSwapMiddlewareRequest<JsonRpcParams>;
  fetchQuotes: (quotesInput: GenericQuoteRequest) => Promise<QuoteResponse[]>;
  setSwapQuotes: (
    uniqueId: string,
    info: { quotes?: QuoteResponse[]; latency?: number },
  ) => void;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dappSwapMetricsFlag: { enabled: boolean; bridge_quote_fees: number };
  securityAlertId?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { enabled: dappSwapEnabled, bridge_quote_fees: bridgeQuoteFees } =
      dappSwapMetricsFlag;
    if (!dappSwapEnabled || !securityAlertId) {
      return;
    }
    const { params, origin } = req;

    if (origin === DAPP_SWAP_COMPARISON_ORIGIN || origin === TEST_DAPP_ORIGIN) {
      const { data, from, chainId } = getSwapDetails(params);
      if (data) {
        const { quotesInput } = getDataFromSwap(chainId as Hex, data);
        if (quotesInput) {
          const startTime = new Date().getTime();
          fetchQuotes({
            ...quotesInput,
            walletAddress: from,
            fee: bridgeQuoteFees ?? DEFAULT_QUOTEFEE,
          })
            .then((quotes) => {
              const endTime = new Date().getTime();
              const latency = endTime - startTime;
              if (quotes) {
                setSwapQuotes(securityAlertId, { quotes, latency });
              }
            })
            .catch((error) => {
              log.error('Error fetching dapp swap quotes', error);
              captureException(error);
            });
        }
      }
    }
  } catch (error) {
    log.error('Error fetching dapp swap quotes', error);
    captureException(error);
  }
}
