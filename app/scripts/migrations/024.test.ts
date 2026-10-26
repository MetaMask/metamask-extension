/* Conditional expectations are intentional. */
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import data from '../first-time-state';
import migration24 from './024';

type MigrationInput = Parameters<typeof migration24.migrate>[0];
type LegacyTransaction = Pick<TransactionMeta, 'status'> & {
  txParams: Pick<TransactionMeta['txParams'], 'from'>;
};
type TransactionControllerKey = 'TransactionController';
type LegacyStorage = {
  meta: { version: number };

  data: Record<
    TransactionControllerKey,
    {
      transactions: LegacyTransaction[];
    }
  >;
};

const firstTimeState = {
  meta: { version: 0 },
  data,
};
const storage: LegacyStorage = {
  meta: { version: 0 },
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions: LegacyTransaction[] = [];

while (transactions.length <= 10) {
  transactions.push({
    txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' },
    status: TransactionStatus.unapproved,
  });
  transactions.push({
    txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' },
    status: TransactionStatus.confirmed,
  });
}

storage.data.TransactionController.transactions = transactions;

describe('storage is migrated successfully and the txParams.from are lowercase', () => {
  it('should lowercase the from for unapproved txs', async () => {
    const migratedData = await migration24.migrate(storage as MigrationInput);
    const migratedTransactions = (migratedData.data as typeof storage.data)
      .TransactionController.transactions;

    migratedTransactions.forEach((tx) => {
      if (tx.status === TransactionStatus.unapproved) {
        expect(tx.txParams.from).toStrictEqual(
          '0x8acce2391c0d510a6c5e5d8f819a678f79b7e675',
        );
      } else {
        expect(tx.txParams.from).toStrictEqual(
          '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675',
        );
      }
    });
  });

  it('should migrate first time state', async () => {
    const migratedData = await migration24.migrate(
      firstTimeState as MigrationInput,
    );
    expect(migratedData.meta.version).toStrictEqual(24);
  });
});
