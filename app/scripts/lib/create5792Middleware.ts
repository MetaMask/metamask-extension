import { createAsyncMiddleware } from '@metamask/json-rpc-engine';
import {
  TransactionBatchRequest,
  TransactionBatchResult,
  TransactionController,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { v4 } from 'uuid';

type SendCallsParams = {
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

type SendCallsResult = string;

type GetCallsStatusParams = string;

type GetCallsStatusResult = {
  status: 'PENDING' | 'CONFIRMED';
  receipts?: {
    logs: {
      address: Hex;
      data: Hex;
      topics: Hex[];
    }[];
    status: Hex;
    chainId: Hex;
    blockHash: Hex;
    blockNumber: Hex;
    gasUsed: Hex;
    transactionHash: Hex;
  }[];
};

type AddTransactionBatchHook = (
  request: TransactionBatchRequest,
  options?: { waitForSubmit?: boolean },
) => Promise<TransactionBatchResult>;

const METHOD_SEND_CALLS = 'wallet_sendCalls';
const METHOD_GET_CALLS_STATUS = 'wallet_getCallsStatus';

const transactionIdsByRequestId: Record<string, string[]> = {};

export function create5792Middleware({
  addTransactionBatch,
  getTransactions,
}: {
  addTransactionBatch: AddTransactionBatchHook;
  getTransactions: () => Promise<TransactionMeta[]>;
}) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req as Record<string, any>;

    if (method === METHOD_SEND_CALLS) {
      res.result = await sendCalls(req, params[0], addTransactionBatch);
    } else if (method === METHOD_GET_CALLS_STATUS) {
      res.result = await getCallsStatus(req, params[0], getTransactions);
    } else {
      next();
    }
  });
}

async function sendCalls(
  request: Record<string, any>,
  params: SendCallsParams,
  addTransactionBatch: AddTransactionBatchHook,
): Promise<SendCallsResult> {
  const { networkClientId, origin } = request;

  const batchRequest: TransactionBatchRequest = {
    networkClientId,
    origin,
    sequential: false,
    requests: params.calls.map((call) => ({
      params: {
        from: params.from,
        to: call.to,
        data: call.data,
        value: call.value,
      },
    })),
  };

  const result = await addTransactionBatch(batchRequest, {
    waitForSubmit: true,
  });

  const id = v4();

  const transactionIds = result.results.map(
    (entryResult) => entryResult.transactionId,
  );

  transactionIdsByRequestId[id] = transactionIds;

  return id;
}

async function getCallsStatus(
  _request: Record<string, any>,
  params: GetCallsStatusParams,
  getTransactions: () => Promise<TransactionMeta[]>,
): Promise<GetCallsStatusResult | null> {
  const transactionIds = transactionIdsByRequestId[params];

  if (!transactionIds) {
    return null;
  }

  const transactions = await getTransactions();

  const transactionMeta = transactionIds.map((id) =>
    transactions.find((tx) => tx.id === id),
  );

  const status = transactionMeta.every(
    (tx) => tx?.status === TransactionStatus.confirmed,
  )
    ? 'CONFIRMED'
    : 'PENDING';

  const receipts = transactionMeta.map(
    (tx) => tx?.txReceipt,
  ) as unknown as GetCallsStatusResult['receipts'];

  return {
    status,
    receipts,
  };
}
