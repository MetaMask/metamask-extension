/* Conditional expectations are intentional. */
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import data from '../first-time-state';
import migration25 from './025';

type MigrationInput = Parameters<typeof migration25.migrate>[0];
type LegacyTransaction = Pick<TransactionMeta, 'status'> & {
  txParams: Pick<TransactionMeta['txParams'], 'from'> & {
    random?: string;
    chainId?: number;
  };
};

const firstTimeState = {
  meta: { version: 0 },
  data,
};

const storage = {
  meta: { version: 0 },
  data: {
    TransactionController: {
      transactions: [] as LegacyTransaction[],
    },
  },
};

const transactions: LegacyTransaction[] = [];

while (transactions.length <= 10) {
  transactions.push({
    txParams: {
      from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675',
      random: 'stuff',
      chainId: 2,
    },
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
    const migratedData = await migration25.migrate(storage as MigrationInput);

    const migratedTransactions = (migratedData.data as typeof storage.data)
      .TransactionController.transactions;
    migratedTransactions.forEach((tx) => {
      if (tx.status === TransactionStatus.unapproved) {
        expect(!tx.txParams.random).toStrictEqual(true);
      }
      if (tx.status === TransactionStatus.unapproved) {
        expect(!tx.txParams.chainId).toStrictEqual(true);
      }
    });
  });

  it('should migrate first time state', async () => {
    const migratedData = await migration25.migrate(
      firstTimeState as MigrationInput,
    );

    expect(migratedData.meta.version).toStrictEqual(25);
  });
});
