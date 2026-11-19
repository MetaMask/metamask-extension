import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import migration23 from './023';

type MigrationInput = Parameters<typeof migration23.migrate>[0];
type LegacyTransaction = Pick<TransactionMeta, 'status'>;
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

const storage: LegacyStorage = {
  meta: { version: 0 },
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions: LegacyTransaction[] = [];
const transactions40: LegacyTransaction[] = [];
const transactions20: LegacyTransaction[] = [];

const txStates = Object.values(TransactionStatus);

const deletableTxStates = [
  TransactionStatus.confirmed,
  TransactionStatus.rejected,
  TransactionStatus.failed,
  TransactionStatus.dropped,
];

let nonDeletableCount = 0;

let status: TransactionStatus;
while (transactions.length <= 100) {
  status = txStates[
    Math.floor(Math.random() * Math.floor(txStates.length - 1))
  ] as TransactionStatus;
  if (!deletableTxStates.includes(status)) {
    nonDeletableCount += 1;
  }
  transactions.push({ status });
}

while (transactions40.length < 40) {
  status = txStates[
    Math.floor(Math.random() * Math.floor(txStates.length - 1))
  ] as TransactionStatus;
  transactions40.push({ status });
}

while (transactions20.length < 20) {
  status = txStates[
    Math.floor(Math.random() * Math.floor(txStates.length - 1))
  ] as TransactionStatus;
  transactions20.push({ status });
}

storage.data.TransactionController.transactions = transactions;

describe('storage is migrated successfully and the proper transactions are remove from state', () => {
  it('should remove transactions that are unneeded', async () => {
    const migratedData = await migration23.migrate(storage as MigrationInput);

    let leftoverNonDeletableTxCount = 0;
    const migratedTransactions = (migratedData.data as typeof storage.data)
      .TransactionController.transactions;
    migratedTransactions.forEach((tx) => {
      if (!deletableTxStates.includes(tx.status)) {
        leftoverNonDeletableTxCount += 1;
      }
    });

    expect(leftoverNonDeletableTxCount).toStrictEqual(nonDeletableCount);

    expect(migratedTransactions.length >= 40).toStrictEqual(true);
  });

  it('should not remove any transactions because 40 is the expected limit', async () => {
    storage.meta.version = 22;
    storage.data.TransactionController.transactions = transactions40;

    const migratedData = await migration23.migrate(storage as MigrationInput);
    const migratedTransactions = (migratedData.data as typeof storage.data)
      .TransactionController.transactions;

    expect(migratedTransactions).toHaveLength(40);
  });

  it('should not remove any transactions because 20 txs is under the expected limit', async () => {
    storage.meta.version = 22;
    storage.data.TransactionController.transactions = transactions20;

    const migratedData = await migration23.migrate(storage as MigrationInput);
    const migratedTransactions = (migratedData.data as typeof storage.data)
      .TransactionController.transactions;

    expect(migratedTransactions).toHaveLength(20);
  });
});
