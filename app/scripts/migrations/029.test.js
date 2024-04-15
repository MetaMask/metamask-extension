import { TransactionStatus } from '@metamask/transaction-controller';
import migration29 from './029';

const properTime = new Date().getTime();
const storage = {
  meta: {},
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
      ],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', () => {
  it('should auto fail transactions more than 12 hours old', async () => {
    const migratedData = await migration29.migrate(storage);
    const txs = migratedData.data.TransactionController.transactions;
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
