const assert = require('assert')
const migrationTemplate = require('../../../app/scripts/migrations/template')
const storage = {
  meta: {},
  data: {},
}

describe('storage is migrated successfully', () => {
  it('should work', (done) => {
    migrationTemplate.migrate(storage)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 0)
        done()
      }).catch(done)
  })
})
