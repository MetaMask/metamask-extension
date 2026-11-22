// next version number
/*

normalizes txParams on unconfirmed txs

*/
import { cloneDeep } from 'lodash';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { addHexPrefix } from '../lib/util';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 25;

export default {
  version,

  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyTransactionState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

type NormalizedKey = keyof Pick<
  TransactionMeta['txParams'],
  'from' | 'to' | 'nonce' | 'value' | 'data' | 'gas' | 'gasPrice'
>;

type LegacyTransactionParams = Partial<Record<NormalizedKey, string>>;

type LegacyTransactionMeta = Pick<TransactionMeta, 'status'> & {
  txParams: LegacyTransactionParams;
};

type LegacyTransactionState = MigrationState['data'] &
  Partial<
    Record<'TransactionController', { transactions?: LegacyTransactionMeta[] }>
  >;

function transformState(state: LegacyTransactionState) {
  const newState = state;

  if (newState.TransactionController) {
    if (newState.TransactionController.transactions) {
      const { transactions } = newState.TransactionController;
      newState.TransactionController.transactions = transactions.map(
        (txMeta) => {
          if (txMeta.status !== TransactionStatus.unapproved) {
            return txMeta;
          }
          txMeta.txParams = normalizeTxParams(txMeta.txParams);
          return txMeta;
        },
      );
    }
  }

  return newState;
}

function normalizeTxParams(
  txParams: LegacyTransactionParams,
): LegacyTransactionParams {
  // functions that handle normalizing of that key in txParams
  const whiteList: Record<NormalizedKey, (value: string) => string> = {
    from: (from) => addHexPrefix(from).toLowerCase(),
    to: (to) => addHexPrefix(to).toLowerCase(),
    nonce: (nonce) => addHexPrefix(nonce),
    value: (value) => addHexPrefix(value),
    data: (data) => addHexPrefix(data),
    gas: (gas) => addHexPrefix(gas),
    gasPrice: (gasPrice) => addHexPrefix(gasPrice),
  };

  // apply only keys in the whiteList
  const normalizedTxParams: LegacyTransactionParams = {};
  (Object.keys(whiteList) as NormalizedKey[]).forEach((key) => {
    const value = txParams[key];
    if (value) {
      normalizedTxParams[key] = whiteList[key](value);
    }
  });

  return normalizedTxParams;
}
