import { Json, JsonRpcResponse } from '@metamask/utils';
import {
  GenericQuoteRequest,
  QuoteResponse,
} from '@metamask/bridge-controller';

import {
  DappSwapMiddlewareRequest,
  getQuotesForConfirmation,
} from './dapp-swap-util';

export function createDappSwapMiddleware<
  Params extends (string | { to: string })[],
  Result extends Json,
>({
  fetchQuotes,
  setSwapQuotes,
  getNetworkConfigurationByNetworkClientId,
  dappSwapMetricsFlag,
}: {
  fetchQuotes: (quotesInput: GenericQuoteRequest) => Promise<QuoteResponse[]>;
  setSwapQuotes: (
    uniqueId: string,
    info: { quotes?: QuoteResponse[]; latency?: number },
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
        setSwapQuotes,
        getNetworkConfigurationByNetworkClientId,
        dappSwapMetricsFlag,
        securityAlertId,
      });
    }

    next();
  };
}
