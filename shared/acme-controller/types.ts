import type { TransactionMeta } from '@metamask/transaction-controller';

export type V1TransactionByHashResponse = {
  hash: string;
  timestamp: string; // ISO string
  chainId: number; // API returns decimal number
  blockNumber: number;
  blockHash: string;
  gas: number;
  gasUsed: number;
  gasPrice: string;
  effectiveGasPrice: string;
  nonce: number;
  cumulativeGasUsed: number;
  methodId: string; // hex string
  value: string;
  to: string; // address
  from: string; // address
  isError?: boolean;
  valueTransfers: {
    from: string; // address
    to: string; // address
    amount: string; // raw amount as string
    decimal?: number; // not always provided
    contractAddress: string;
    symbol: string; // e.g., 'USDC'
    name?: string; // e.g., 'USD Coin'
    transferType?: string; // e.g., 'erc20'
  }[];
  logs: {
    data: string;
    topics: string[];
    address: string;
    logIndex: number;
  }[];
  toAddressName?: string; // e.g., 'METAMASK_BRIDGE_V2'
  transactionProtocol?: string; // e.g., 'ERC_20', 'METAMASK'
  transactionCategory: string; // e.g., 'APPROVE', 'BRIDGE_OUT', 'TRANSFER', 'CONTRACT_CALL', etc.
  transactionType: string; // e.g., 'ERC_20_APPROVE', 'METAMASK_BRIDGE_V2_BRIDGE_OUT', 'GENERIC_CONTRACT_CALL', etc.
  readable: string; // e.g., 'Token: Approve', 'MetaMask Bridge V2: Bridge Withdraw', 'Unidentified Transaction'
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

export type TransactionViewModel = Pick<
  V1TransactionByHashResponse,
  'hash' | 'timestamp' | 'chainId' | 'value' | 'to' | 'from'
> &
  Partial<
    Omit<
      V1TransactionByHashResponse,
      'hash' | 'timestamp' | 'chainId' | 'value' | 'to' | 'from'
    >
  > & {
    pendingTransactionMeta?: TransactionMeta;
  };

export type DateGroupedTransactions = {
  date: number;
  transactions: TransactionViewModel[];
};

export type FlattenedItem =
  | { type: 'date-header'; date: number }
  | { type: 'transaction'; data: TransactionViewModel; id: string };
