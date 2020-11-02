import assert from 'assert'
import migration29 from '../../../app/scripts/migrations/029'

const properTime = new Date().getTime()
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [
        { status: 'approved', id: 1, submittedTime: 0 },
        { status: 'approved', id: 2, submittedTime: properTime },
        { status: 'confirmed', id: 3, submittedTime: properTime },
        { status: 'submitted', id: 4, submittedTime: properTime },
        { status: 'submitted', id: 5, submittedTime: 0 },
      ],
    },
  },
}

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', function () {
  it('should auto fail transactions more than 12 hours old', function (done) {
    migration29
      .migrate(storage)
      .then((migratedData) => {
        const txs = migratedData.data.TransactionController.transactions
        const [txMeta1] = txs
        assert.equal(migratedData.meta.version, 29)

        assert.equal(txMeta1.status, 'failed', 'old tx is auto failed')
        assert(
          txMeta1.err.message.includes('too long'),
          'error message assigned',
        )

        txs.forEach((tx) => {
          if (tx.id === 1) {
            return
          }
          assert.notEqual(tx.status, 'failed', 'other tx is not auto failed')
        })

        done()
      })
      .catch(done)
  })
})
