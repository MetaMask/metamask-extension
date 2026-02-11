import type { Hex } from 'viem';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';
import type { TransactionGroupCategory } from '../constants/transaction';

export type NormalizedGetAccountTransactionsResponse = Omit<
  V4MultiAccountTransactionsResponse,
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
