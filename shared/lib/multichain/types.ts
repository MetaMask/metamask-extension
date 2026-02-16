import type { Hex } from 'viem';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';
import type { TransactionGroupCategory } from '../../constants/transaction';

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
  amounts?: {
    from?: TokenAmount;
    to?: TokenAmount;
  };
  transactionType: string;
  category: TransactionGroupCategory;
};
