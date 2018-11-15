const assert = require('assert')
const migration29 = require('../../../app/scripts/migrations/029')
const properTime = (new Date()).getTime()
const storage = {
  'meta': {},
  'data': {
    'TransactionController': {
      'transactions': [
        { 'status': 'approved', id: 1, submittedTime: 0 },
        { 'status': 'approved', id: 2, 'submittedTime': properTime },
        {'status': 'confirmed', id: 3, submittedTime: properTime},
        {'status': 'submitted', id: 3, submittedTime: properTime},
      ],
    },
  },
}

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', () => {
  it('should auto fail transactions more than 12 hours old', (done) => {
    migration29.migrate(storage)
    .then((migratedData) => {
      const [txMeta1, txMeta2, txMeta3] = migratedData.data.TransactionController.transactions
      assert.equal(migratedData.meta.version, 29)

      assert.equal(txMeta1.status, 'failed', 'old tx is auto failed')
      assert(txMeta1.err.message.includes('too long'), 'error message assigned')

      assert.notEqual(txMeta2.status, 'failed', 'newer tx is not auto failed')
      assert.notEqual(txMeta3.status, 'failed', 'newer tx is not auto failed')

      done()
    }).catch(done)
  })
})
