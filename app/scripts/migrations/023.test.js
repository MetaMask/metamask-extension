import { strict as assert } from 'assert';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import migration23 from './023';

const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [],
    },
  },
};

const transactions = [];
const transactions40 = [];
const transactions20 = [];

const txStates = Object.values(TRANSACTION_STATUSES);

const deletableTxStates = [
  TRANSACTION_STATUSES.CONFIRMED,
  TRANSACTION_STATUSES.REJECTED,
  TRANSACTION_STATUSES.FAILED,
  TRANSACTION_STATUSES.DROPPED,
];

let nonDeletableCount = 0;

let status;
while (transactions.length <= 100) {
  status =
    txStates[Math.floor(Math.random() * Math.floor(txStates.length - 1))];
  // This is an old migration, let's allow it
  // eslint-disable-next-line no-loop-func
  if (!deletableTxStates.find((s) => s === status)) {
    nonDeletableCount += 1;
  }
  transactions.push({ status });
}

while (transactions40.length < 40) {
  status =
    txStates[Math.floor(Math.random() * Math.floor(txStates.length - 1))];
  transactions40.push({ status });
}

while (transactions20.length < 20) {
  status =
    txStates[Math.floor(Math.random() * Math.floor(txStates.length - 1))];
  transactions20.push({ status });
}

storage.data.TransactionController.transactions = transactions;

describe('storage is migrated successfully and the proper transactions are remove from state', function () {
  it('should remove transactions that are unneeded', function (done) {
    migration23
      .migrate(storage)
      .then((migratedData) => {
        let leftoverNonDeletableTxCount = 0;
        const migratedTransactions =
          migratedData.data.TransactionController.transactions;
        migratedTransactions.forEach((tx) => {
          if (!deletableTxStates.find((s) => s === tx.status)) {
            leftoverNonDeletableTxCount += 1;
          }
        });
        assert.equal(
          leftoverNonDeletableTxCount,
          nonDeletableCount,
          "migration shouldn't delete transactions we want to keep",
        );
        assert(
          migratedTransactions.length >= 40,
          `should be equal or greater to 40 if they are non deletable states got ${migratedTransactions.length} transactions`,
        );
        done();
      })
      .catch(done);
  });

  it('should not remove any transactions because 40 is the expected limit', function (done) {
    storage.meta.version = 22;
    storage.data.TransactionController.transactions = transactions40;
    migration23
      .migrate(storage)
      .then((migratedData) => {
        const migratedTransactions =
          migratedData.data.TransactionController.transactions;

        assert.equal(
          migratedTransactions.length,
          40,
          "migration shouldn't delete when at limit",
        );
        done();
      })
      .catch(done);
  });

  it('should not remove any transactions because 20 txs is under the expected limit', function (done) {
    storage.meta.version = 22;
    storage.data.TransactionController.transactions = transactions20;
    migration23
      .migrate(storage)
      .then((migratedData) => {
        const migratedTransactions =
          migratedData.data.TransactionController.transactions;
        assert.equal(
          migratedTransactions.length,
          20,
          "migration shouldn't delete when under limit",
        );
        done();
      })
      .catch(done);
  });
});
