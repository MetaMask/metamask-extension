import type { Hex } from 'viem';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';
import type { TransactionGroupCategory } from '../constants/transaction';

export type NormalizedV4MultiAccountTransactionsResponse = Omit<
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

export type TokenAmount = {
  amount: bigint;
  decimal: number;
  symbol?: string;
};

export type TransactionViewModel = TransactionMeta & {
  readable?: string;
  amounts?: {
    from?: TokenAmount;
    to?: TokenAmount;
  };
  transactionType: string;
  category: TransactionGroupCategory;
};
