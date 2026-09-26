import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import migration22 from './022';

type MigrationInput = Parameters<typeof migration22.migrate>[0];
type LegacyTransaction = Pick<TransactionMeta, 'status' | 'submittedTime'>;

const properTime = new Date().getTime();
const storage = {
  meta: { version: 0 },
  data: {
    TransactionController: {
      transactions: [
        { status: TransactionStatus.submitted },
        { status: TransactionStatus.submitted, submittedTime: properTime },
        { status: TransactionStatus.confirmed },
      ],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', () => {
  it('should add submittedTime key on the txMeta if appropriate', async () => {
    const migratedData = await migration22.migrate(storage as MigrationInput);
    const migratedState = migratedData.data as Record<
      'TransactionController',
      {
        transactions: [LegacyTransaction, LegacyTransaction, LegacyTransaction];
      }
    >;
    const [txMeta1, txMeta2, txMeta3] =
      migratedState.TransactionController.transactions;

    expect(migratedData.meta.version).toStrictEqual(22);
    expect(txMeta1.submittedTime).toBeDefined();
    expect(txMeta2.submittedTime).toStrictEqual(properTime);
    expect(txMeta3.submittedTime).toBeUndefined();
  });
});
