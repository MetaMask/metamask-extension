import type { TransactionMeta } from '@metamask/transaction-controller';

export type V1TransactionByHashResponse = {
  hash: string;
  timestamp: string;
  chainId: number; // API returns decimal number
  blockNumber: number;
  blockHash: string;
  gas: number;
  gasUsed: number;
  gasPrice: string;
  effectiveGasPrice: string;
  nonce: number;
  cumulativeGasUsed: number;
  methodId?: string;
  value: string;
  to: string;
  from: string;
  isError?: boolean;
  valueTransfers?: {
    from: string;
    to: string;
    amount: string;
    decimal: number;
    contractAddress: string;
    symbol: string;
    name: string;
    transferType: string;
  }[];
  logs?: {
    data: string;
    topics: string[];
    address: string;
    logIndex: number;
  }[];
  transactionType?: string;
  transactionCategory?: string;
  transactionProtocol?: string;
};

/**
 * Extended type for pending transactions that have been transformed to API shape
 * Includes reference to original TransactionMeta for actions (speed up/cancel)
 */
export type TransactionForDisplay = V1TransactionByHashResponse & {
  pendingTransactionMeta?: TransactionMeta;
};

export type V4MultiAccountTransactionsResponse = {
  unprocessedNetworks: string[];
  pageInfo: {
    count: number;
    hasNextPage: boolean;
    endCursor?: string;
  };
  data: V1TransactionByHashResponse[];
};

export type DateGroupedTransactions = {
  date: string;
  dateMillis: number;
  transactions: TransactionForDisplay[];
};

export type FlattenedItem =
  | { type: 'date-header'; date: string; dateMillis: number }
  | { type: 'transaction'; data: TransactionForDisplay; id: string };
