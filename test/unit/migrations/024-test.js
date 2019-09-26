const assert = require('assert')
const migration24 = require('../../../app/scripts/migrations/024')
const firstTimeState = {
  meta: {},
  data: require('../../../app/scripts/first-time-state'),
}
const storage = {
  'meta': {},
  'data': {
    'TransactionController': {
      'transactions': [
      ],
    },
  },
}

const transactions = []


while (transactions.length <= 10) {
  transactions.push({ txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' }, status: 'unapproved' })
  transactions.push({ txParams: { from: '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675' }, status: 'confirmed' })
}


storage.data.TransactionController.transactions = transactions

describe('storage is migrated successfully and the txParams.from are lowercase', () => {
  it('should lowercase the from for unapproved txs', (done) => {
    migration24.migrate(storage)
      .then((migratedData) => {
        const migratedTransactions = migratedData.data.TransactionController.transactions
        migratedTransactions.forEach((tx) => {
          if (tx.status === 'unapproved') assert.equal(tx.txParams.from, '0x8acce2391c0d510a6c5e5d8f819a678f79b7e675')
          else assert.equal(tx.txParams.from, '0x8aCce2391c0d510a6c5E5d8f819a678f79b7e675')
        })
        done()
      }).catch(done)
  })

  it('should migrate first time state', (done) => {
    migration24.migrate(firstTimeState)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 24)
        done()
      }).catch(done)
  })
})
