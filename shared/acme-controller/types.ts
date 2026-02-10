import type { Hex } from 'viem';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionGroupCategory } from '../constants/transaction';

// transaction-controlller TransactionResponse plus missing fields from the API
export type TransactionResponse = {
  hash: string; // hex string
  timestamp: string; // ISO string
  chainId: number; // API returns decimal number
  accountId: string; // e.g., 'eip155:137:0x9bed78535d6a03a955f1504aadba974d9a29e292'
  blockNumber: number;
  blockHash: string;
  gas: number;
  gasUsed: number;
  gasPrice: string;
  effectiveGasPrice: string;
  nonce: number;
  cumulativeGasUsed: number;
  methodId: string | null; // hex string or null for simple transfers
  value: string;
  to: string; // address
  from: string; // address
  isError: boolean;
  valueTransfers: {
    contractAddress?: string; // token contract address (present for token transfers)
    decimal?: number; // token decimals (present for ERC20)
    symbol?: string; // e.g., 'USDC'
    from: string; // address
    to: string; // address
    amount: string; // raw amount as string

    tokenId?: string; // token ID (present for ERC721/ERC1155)
    transferType?: string; // e.g., 'erc20', 'erc721', 'erc1155', 'normal'
    name?: string; // e.g., 'USD Coin'
  }[];

  logs: {
    data: string;
    topics: string[];
    address: string;
    logIndex: number;
  }[];
  toAddressName?: string; // e.g., 'METAMASK_BRIDGE_V2'
  transactionCategory: string; // e.g., 'APPROVE', 'BRIDGE_OUT', 'TRANSFER', 'CONTRACT_CALL', etc.
  transactionProtocol?: string; // e.g., 'ERC_20', 'METAMASK'
  transactionType: string; // e.g., 'ERC_20_APPROVE', 'METAMASK_BRIDGE_V2_BRIDGE_OUT', 'GENERIC_CONTRACT_CALL', etc.
  readable: string; // e.g., 'Token: Approve', 'MetaMask Bridge V2: Bridge Withdraw', 'Unidentified Transaction', 'Spam Token: Transfer'
};

export type GetAccountTransactionsResponse = {
  data: TransactionResponse[];
  unprocessedNetworks?: string[];
  pageInfo: {
    count: number;
    hasNextPage: boolean;
    endCursor?: string;
  };
};

export type NormalizedGetAccountTransactionsResponse = Omit<
  GetAccountTransactionsResponse,
  'data'
> & {
  data: TransactionViewModel[];
};

export type TransactionGroup = {
  hasCancelled: boolean;
  hasRetried: boolean;
  initialTransaction: TransactionMeta;
  nonce: Hex;
  primaryTransaction: TransactionMeta;
  transactions: TransactionMeta[];
};

export type TransactionViewModel = TransactionMeta & {
  readable?: string;
  amounts?: {
    from?: {
      amount: bigint;
      decimal: number;
      symbol?: string;
    };
    to?: {
      amount: bigint;
      decimal: number;
      symbol?: string;
    };
  };
  transactionType: string;
  category: TransactionGroupCategory;
};

export type DateGroupedTransactions = {
  date: number;
  transactions: TransactionViewModel[];
};

export type FlattenedItem =
  | { type: 'date-header'; date: number }
  | { type: 'transaction'; data: TransactionViewModel; id: string };
