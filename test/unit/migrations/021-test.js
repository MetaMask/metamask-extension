const assert = require('assert')

const wallet2 = require('../../lib/migrations/002.json')
const migration21 = require('../../../app/scripts/migrations/021')

describe('wallet2 is migrated successfully with out the BlacklistController', () => {
  it('should delete BlacklistController key', (done) => {
    migration21.migrate(wallet2)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 21)
        assert(!migratedData.data.BlacklistController)
        assert(!migratedData.data.RecentBlocks)
        done()
      }).catch(done)
  })
})
