import assert from 'assert'
import migration24 from '../../../app/scripts/migrations/024'
import data from '../../../app/scripts/first-time-state'

const firstTimeState = {
  meta: {},
  data,
}
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [],
    },
  },
}

const transactions = []

while (transactions.length <= 10) {
  transactions.push({
    txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' },
    status: 'unapproved',
  })
  transactions.push({
    txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' },
    status: 'confirmed',
  })
}

storage.data.TransactionController.transactions = transactions

describe('storage is migrated successfully and the txParams.from are lowercase', function () {
  it('should lowercase the from for unapproved txs', function (done) {
    migration24
      .migrate(storage)
      .then((migratedData) => {
        const migratedTransactions =
          migratedData.data.TransactionController.transactions
        migratedTransactions.forEach((tx) => {
          if (tx.status === 'unapproved') {
            assert.equal(
              tx.txParams.from,
              '0x8acce2391c0d510a6c5e5d8f819a678f79b7e675',
            )
          } else {
            assert.equal(
              tx.txParams.from,
              '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675',
            )
          }
        })
        done()
      })
      .catch(done)
  })

  it('should migrate first time state', function (done) {
    migration24
      .migrate(firstTimeState)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 24)
        done()
      })
      .catch(done)
  })
})
