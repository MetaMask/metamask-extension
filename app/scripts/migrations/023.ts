/*

This migration removes transactions that are no longer usefull down to 40 total

*/

import { cloneDeep } from 'lodash';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 23;

export default {
  version,

  migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyTransactionState;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

type LegacyTransactionMeta = Pick<TransactionMeta, 'status'>;

type LegacyTransactionState = MigrationState['data'] &
  Partial<
    Record<'TransactionController', { transactions?: LegacyTransactionMeta[] }>
  >;

function transformState(state: LegacyTransactionState) {
  const newState = state;

  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = TransactionController;

    if (transactions.length <= 40) {
      return newState;
    }

    const reverseTxList = transactions.reverse();
    let stripping = true;
    while (reverseTxList.length > 40 && stripping) {
      const txIndex = reverseTxList.findIndex((txMeta) => {
        return (
          txMeta.status === TransactionStatus.failed ||
          txMeta.status === TransactionStatus.rejected ||
          txMeta.status === TransactionStatus.confirmed ||
          txMeta.status === TransactionStatus.dropped
        );
      });
      if (txIndex < 0) {
        stripping = false;
      } else {
        reverseTxList.splice(txIndex, 1);
      }
    }

    TransactionController.transactions = reverseTxList.reverse();
  }
  return newState;
}
