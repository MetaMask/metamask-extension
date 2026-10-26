import { TransactionStatus } from '@metamask/transaction-controller';
import firstTimeState from '../first-time-state';
import migration27 from './027';

type MigrationInput = Parameters<typeof migration27.migrate>[0];

type TransactionControllerFixture = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TransactionController: { transactions: { status: TransactionStatus }[] };
};

const oldStorage: MigrationInput = {
  meta: { version: 26 },
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions: { status: TransactionStatus }[] = [];

while (transactions.length < 9) {
  transactions.push({ status: TransactionStatus.rejected });
  transactions.push({ status: TransactionStatus.unapproved });
  transactions.push({ status: TransactionStatus.approved });
}

(
  oldStorage.data as TransactionControllerFixture
).TransactionController.transactions = transactions;

describe('migration #27', () => {
  it('should remove rejected transactions', async () => {
    const newStorage = await migration27.migrate(
      oldStorage as unknown as MigrationInput,
    );

    const newTransactions = (newStorage.data as TransactionControllerFixture)
      .TransactionController.transactions;

    expect(newTransactions).toHaveLength(6);

    newTransactions.forEach((txMeta) => {
      if (txMeta.status === TransactionStatus.rejected) {
        throw new Error('transaction was found with a status of rejected');
      }
    });
  });

  it('should successfully migrate first time state', async () => {
    const migratedData = await migration27.migrate({
      meta: { version: 26 },
      data: firstTimeState,
    });

    expect(migratedData.meta.version).toStrictEqual(migration27.version);
  });
});
