import { strict as assert } from 'assert';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration22 from './022';

const properTime = new Date().getTime();
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [
        { status: TRANSACTION_STATUSES.SUBMITTED },
        { status: TRANSACTION_STATUSES.SUBMITTED, submittedTime: properTime },
        { status: TRANSACTION_STATUSES.CONFIRMED },
      ],
    },
  },
};

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', function () {
  it('should add submittedTime key on the txMeta if appropriate', function (done) {
    migration22
      .migrate(storage)
      .then((migratedData) => {
        const [
          txMeta1,
          txMeta2,
          txMeta3,
        ] = migratedData.data.TransactionController.transactions;
        assert.equal(migratedData.meta.version, 22);
        // should have written a submitted time
        assert(txMeta1.submittedTime);
        // should not have written a submitted time because it already has one
        assert.equal(txMeta2.submittedTime, properTime);
        // should not have written a submitted time
        assert(!txMeta3.submittedTime);
        done();
      })
      .catch(done);
  });
});
