import log from 'loglevel';
import { Hex, JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';
import {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { NestedTransactionMetadata } from '@metamask/transaction-controller';

import { captureException } from '../../../../shared/lib/sentry';
import {
  checkValidSingleOrBatchTransaction,
  getDataFromSwap,
  parseTransactionData,
} from '../../../../shared/modules/dapp-swap-comparison/dapp-swap-comparison-utils';
import { DappSwapComparisonData } from '../../controllers/app-state-controller';
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

export function getQuotesForConfirmation({
  req,
  fetchQuotes,
  setDappSwapComparisonData,
  getNetworkConfigurationByNetworkClientId,
  dappSwapMetricsFlag,
  securityAlertId,
}: {
  req: DappSwapMiddlewareRequest<JsonRpcParams>;
  fetchQuotes: (quotesInput: GenericQuoteRequest) => Promise<QuoteResponse[]>;
  setDappSwapComparisonData: (
    uniqueId: string,
    info: DappSwapComparisonData,
  ) => void;
  getNetworkConfigurationByNetworkClientId: (
    networkClientId: NetworkClientId,
  ) => NetworkConfiguration | undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dappSwapMetricsFlag: { enabled: boolean; bridge_quote_fees: number };
  securityAlertId?: string;
}) {
  let commands = '';
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { enabled: dappSwapEnabled, bridge_quote_fees: bridgeQuoteFees } =
      dappSwapMetricsFlag ?? {};
    if (!dappSwapEnabled || !securityAlertId) {
      return;
    }
    const { params, origin } = req;
    if (origin === DAPP_SWAP_COMPARISON_ORIGIN || origin === TEST_DAPP_ORIGIN) {
      const { chainId } =
        getNetworkConfigurationByNetworkClientId(req.networkClientId) ?? {};
      const { data, from } = getSwapDetails(params);
      if (data && securityAlertId && chainId) {
        const parsedTransactionData = parseTransactionData(data);
        commands = parsedTransactionData.commands;
        const { quotesInput, tokenAddresses } = getDataFromSwap(
          chainId as Hex,
          parsedTransactionData.commandBytes,
          parsedTransactionData.inputs,
        );
        checkValidSingleOrBatchTransaction(
          params[0].calls as NestedTransactionMetadata[],
          quotesInput?.srcTokenAddress as Hex,
        );
        if (quotesInput) {
          const startTime = new Date().getTime();
          fetchQuotes({
            ...quotesInput,
            walletAddress: from,
            fee: bridgeQuoteFees,
          })
            .then((quotes) => {
              const endTime = new Date().getTime();
              const latency = endTime - startTime;
              if (quotes) {
                setDappSwapComparisonData(securityAlertId, {
                  quotes,
                  latency,
                  tokenAddresses: tokenAddresses as Hex[],
                });
              }
            })
            .catch((error) => {
              setDappSwapComparisonData(securityAlertId, {
                error: `Error fetching bridge quotes: ${error.message}`,
                commands,
              });
              log.error('Error fetching dapp swap quotes', error);
              captureException(error);
            });
        }
      }
    }
  } catch (error) {
    if (securityAlertId) {
      setDappSwapComparisonData(securityAlertId, {
        error: `Error fetching bridge quotes: ${(error as Error).toString()}`,
        commands,
      });
    }
    log.error('Error fetching dapp swap quotes', error);
    captureException(error);
  }
}
