import assert from 'assert'
import migration22 from '../../../app/scripts/migrations/022'

const properTime = new Date().getTime()
const storage = {
  meta: {},
  data: {
    TransactionController: {
      transactions: [
        { status: 'submitted' },
        { status: 'submitted', submittedTime: properTime },
        { status: 'confirmed' },
      ],
    },
  },
}

describe('storage is migrated successfully where transactions that are submitted have submittedTimes', function () {
  it('should add submittedTime key on the txMeta if appropriate', function (done) {
    migration22
      .migrate(storage)
      .then((migratedData) => {
        const [
          txMeta1,
          txMeta2,
          txMeta3,
        ] = migratedData.data.TransactionController.transactions
        assert.equal(migratedData.meta.version, 22)
        // should have written a submitted time
        assert(txMeta1.submittedTime)
        // should not have written a submitted time because it already has one
        assert.equal(txMeta2.submittedTime, properTime)
        // should not have written a submitted time
        assert(!txMeta3.submittedTime)
        done()
      })
      .catch(done)
  })
})
