import { Json, JsonRpcResponse } from '@metamask/utils';
import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';
import {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';

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
    info: {
      quotes?: QuoteResponse[];
      latency?: number;
      commands?: string;
      error?: string;
    },
  ) => void;
  getNetworkConfigurationByNetworkClientId: (
    networkClientId: NetworkClientId,
  ) => NetworkConfiguration | undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dappSwapMetricsFlag: { enabled: boolean; bridge_quote_fees: number };
}) {
  return async (
    req: DappSwapMiddlewareRequest<Params>,
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
    const { securityAlertResponse } = req;
    const { securityAlertId } = securityAlertResponse ?? {};

    if (securityAlertId && req.method === 'eth_sendTransaction') {
      getQuotesForConfirmation({
        req,
        fetchQuotes,
        setDappSwapComparisonData,
        getNetworkConfigurationByNetworkClientId,
        dappSwapMetricsFlag,
        securityAlertId,
      });
    }

    next();
  };
}
