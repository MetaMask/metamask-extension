import { Json, JsonRpcResponse } from '@metamask/utils';
import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';
import {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';

import { DappSwapComparisonData } from '../../controllers/app-state-controller';
import {
  DappSwapMiddlewareRequest,
  getQuotesForConfirmation,
} from './dapp-swap-util';

export function createDappSwapMiddleware<
  Params extends (string | { to: string })[],
  Result extends Json,
>({
  fetchQuotes,
  setDappSwapComparisonData,
  getNetworkConfigurationByNetworkClientId,
  dappSwapMetricsFlag,
}: {
  fetchQuotes: (quotesInput: GenericQuoteRequest) => Promise<QuoteResponse[]>;
  setDappSwapComparisonData: (
    uniqueId: string,
    info: DappSwapComparisonData,
  ) => void;
  getNetworkConfigurationByNetworkClientId: (
    networkClientId: NetworkClientId,
  ) => NetworkConfiguration | undefined;
  dappSwapMetricsFlag: {
    enabled: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    bridge_quote_fees: number;
    origins: string[];
  };
}) {
  return async (
    req: DappSwapMiddlewareRequest<Params>,
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
    if (
      req.method === 'eth_sendTransaction' ||
      req.method === 'wallet_sendCalls'
    ) {
      getQuotesForConfirmation({
        req,
        fetchQuotes,
        setDappSwapComparisonData,
        getNetworkConfigurationByNetworkClientId,
        dappSwapMetricsFlag,
      });
    }

    next();
  };
}
