import type { Hex } from 'viem';
import type { TransactionMeta } from '@metamask/transaction-controller';

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
