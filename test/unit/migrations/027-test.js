import assert from 'assert'
import firstTimeState from '../../../app/scripts/first-time-state'
import migration27 from '../../../app/scripts/migrations/027'

const oldStorage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [],
    },
  },
}

const transactions = []

while (transactions.length < 9) {
  transactions.push({ status: 'rejected' })
  transactions.push({ status: 'unapproved' })
  transactions.push({ status: 'approved' })
}

oldStorage.data.TransactionController.transactions = transactions

describe('migration #27', function () {
  it('should remove rejected transactions', function (done) {
    migration27
      .migrate(oldStorage)
      .then((newStorage) => {
        const newTransactions =
          newStorage.data.TransactionController.transactions
        assert.equal(
          newTransactions.length,
          6,
          'transactions is expected to have the length of 6',
        )
        newTransactions.forEach((txMeta) => {
          if (txMeta.status === 'rejected') {
            done(new Error('transaction was found with a status of rejected'))
          }
        })
        done()
      })
      .catch(done)
  })

  it('should successfully migrate first time state', function (done) {
    migration27
      .migrate({
        meta: {},
        data: firstTimeState,
      })
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, migration27.version)
        done()
      })
      .catch(done)
  })
})
