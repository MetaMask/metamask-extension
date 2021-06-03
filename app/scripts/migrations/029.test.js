import { strict as assert } from 'assert';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration29 from './029';

const properTime = new Date().getTime();
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [
        { status: TRANSACTION_STATUSES.APPROVED, id: 1, submittedTime: 0 },
        {
          status: TRANSACTION_STATUSES.APPROVED,
          id: 2,
          submittedTime: properTime,
        },
        {
          status: TRANSACTION_STATUSES.CONFIRMED,
          id: 3,
          submittedTime: properTime,
        },
        {
          status: TRANSACTION_STATUSES.SUBMITTED,
          id: 4,
          submittedTime: properTime,
        },
        { status: TRANSACTION_STATUSES.SUBMITTED, id: 5, submittedTime: 0 },
      ],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', function () {
  it('should auto fail transactions more than 12 hours old', function (done) {
    migration29
      .migrate(storage)
      .then((migratedData) => {
        const txs = migratedData.data.TransactionController.transactions;
        const [txMeta1] = txs;
        assert.equal(migratedData.meta.version, 29);

        assert.equal(
          txMeta1.status,
          TRANSACTION_STATUSES.FAILED,
          'old tx is auto failed',
        );
        assert(
          txMeta1.err.message.includes('too long'),
          'error message assigned',
        );

        txs.forEach((tx) => {
          if (tx.id === 1) {
            return;
          }
          assert.notEqual(
            tx.status,
            TRANSACTION_STATUSES.FAILED,
            'other tx is not auto failed',
          );
        });

        done();
      })
      .catch(done);
  });
});
