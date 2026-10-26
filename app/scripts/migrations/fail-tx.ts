import { cloneDeep } from 'lodash';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

type LegacyTransactionMeta = Pick<
  TransactionMeta,
  'status' | 'submittedTime'
> & {
  err?: {
    message: string;
    note: string;
  };
};

type LegacyTransactionState = MigrationState['data'] &
  Partial<
    Record<'TransactionController', { transactions?: LegacyTransactionMeta[] }>
  >;

export default function failTxsThat(
  version: number,
  reason: string,
  condition: (txMeta: LegacyTransactionMeta) => boolean,
): LegacyMigration['migrate'] {
  return function (originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyTransactionState;
      const newState = transformState(state, condition, reason);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  };
}

function transformState(
  state: LegacyTransactionState,
  condition: (txMeta: LegacyTransactionMeta) => boolean,
  reason: string,
) {
  const newState = state;
  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = TransactionController;

    TransactionController.transactions = transactions.map((txMeta) => {
      if (!condition(txMeta)) {
        return txMeta;
      }

      txMeta.status = TransactionStatus.failed;
      txMeta.err = {
        message: reason,
        note: `Tx automatically failed by migration because ${reason}`,
      };

      return txMeta;
    });
  }
  return newState;
}
