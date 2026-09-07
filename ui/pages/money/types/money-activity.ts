import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * One row in the Money activity list. Card / Accounts API kinds are omitted
 * until extension grows those sources.
 */
export type MoneyActivityItem = {
  kind: 'onchain';
  id: string;
  time: number;
  tx: TransactionMeta;
};

export const onchainItem = (tx: TransactionMeta): MoneyActivityItem => ({
  kind: 'onchain',
  id: tx.id,
  time: tx.time ?? 0,
  tx,
});
