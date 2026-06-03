import type { Hex } from 'viem';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type {
  V1TransactionByHashResponse,
  V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';

export type NormalizedV4MultiAccountTransactionsResponse = Omit<
  V4MultiAccountTransactionsResponse,
  'data'
> & {
  data: TransactionViewModel[];
};

export type TransactionGroup = {
  hasCancelled: boolean;
  hasRetried: boolean;
  initialTransaction: TransactionMeta & { isSmartTransaction?: boolean };
  nonce: Hex;
  primaryTransaction: TransactionMeta;
  transactions: TransactionMeta[];
};

export type Token = {
  address: string;
  symbol: string;
  decimals: number;
  chainId: Hex;
};

export type TokenAmount = {
  token: Token;
  amount: bigint;
};

export type TransactionViewModel = TransactionMeta & {
  readable?: string;
  nonce: number;
  amounts?: {
    from?: TokenAmount;
    to?: TokenAmount;
  };
  transactionType: V1TransactionByHashResponse['transactionType'];
  transactionCategory: V1TransactionByHashResponse['transactionCategory'];
  transactionProtocol: V1TransactionByHashResponse['transactionProtocol'];
  valueTransfers?: V1TransactionByHashResponse['valueTransfers'];
};
