import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import migration29 from './029';

type MigrationInput = Parameters<typeof migration29.migrate>[0];

type LegacyTxMeta = Pick<TransactionMeta, 'status' | 'submittedTime'> & {
  id: number;
};

type TransactionControllerFixture = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TransactionController: { transactions: LegacyTxMeta[] };
};

const properTime = new Date().getTime();
const storage: MigrationInput = {
  meta: { version: 28 },
  data: {
    TransactionController: {
      transactions: [
        { status: TransactionStatus.approved, id: 1, submittedTime: 0 },
        {
          status: TransactionStatus.approved,
          id: 2,
          submittedTime: properTime,
        },
        {
          status: TransactionStatus.confirmed,
          id: 3,
          submittedTime: properTime,
        },
        {
          status: TransactionStatus.submitted,
          id: 4,
          submittedTime: properTime,
        },
        { status: TransactionStatus.submitted, id: 5, submittedTime: 0 },
      ] satisfies LegacyTxMeta[],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', () => {
  it('should auto fail transactions more than 12 hours old', async () => {
    const migratedData = await migration29.migrate(
      storage as unknown as MigrationInput,
    );
    const txs = (migratedData.data as TransactionControllerFixture)
      .TransactionController.transactions;
    const [txMeta1] = txs;

    expect(migratedData.meta.version).toStrictEqual(29);
    expect(txMeta1.status).toStrictEqual(TransactionStatus.failed);

    txs.forEach((tx) => {
      if (tx.id === 1) {
        return;
      }
      expect(tx.status).not.toStrictEqual(TransactionStatus.failed);
    });
  });
});
