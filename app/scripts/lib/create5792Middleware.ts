import { createAsyncMiddleware } from '@metamask/json-rpc-engine';
import {
  TransactionBatchRequest,
  TransactionController,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { v4 } from 'uuid';

type Params = {
  version: string;
  from: Hex;
  chainId: Hex;
  calls: {
    to?: Hex;
    data?: Hex;
    value?: Hex;
  }[];
  capabilities?: Record<string, any> | undefined;
};

const METHOD = 'wallet_sendCalls';

export function create5792Middleware({
  addTransactionBatch,
}: {
  addTransactionBatch: TransactionController['addTransactionBatch'];
}) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, networkClientId, origin, params } = req as Record<
      string,
      any
    >;

    if (method !== METHOD) {
      next();
      return;
    }

    const sendRequest = params[0] as Params;

    const request: TransactionBatchRequest = {
      networkClientId,
      origin,
      sequential: false,
      requests: sendRequest.calls.map((call) => ({
        params: {
          from: sendRequest.from,
          to: call.to,
          data: call.data,
          value: call.value,
        },
      })),
    };

    const id = v4();

    const result = await addTransactionBatch(request);
    await result.waitForSubmit();

    res.result = id;
  });
}
