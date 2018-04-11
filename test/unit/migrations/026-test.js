const assert = require('assert')
const migration26 = require('../../../app/scripts/migrations/026')
const firstTimeState = {
  meta: {},
  data: require('../../../app/scripts/first-time-state'),
}

const storage = {
  "meta": {},
  "data": {
    seedWords: 'foo',
    forgottenPassword: 'bar',
  },
}

describe('config controller migration', () => {
  it('should migrate config manager keys into config branch', (done) => {
    migration26.migrate(storage)
    .then((migratedData) => {
      const data = migratedData.data
      assert('Config' in data, 'Config key is present')
      assert.equal(data.Config.seedWords, 'foo', 'seed words were migrated correctly.')
      assert.equal(data.Config.forgottenPassword, 'bar', 'forgotten password was migrated correctly.')
      done()
    }).catch(done)
  })

  it('should migrate first time state', (done) => {
    migration26.migrate(firstTimeState)
    .then((migratedData) => {
      assert.equal(migratedData.meta.version, 26)
      done()
    }).catch(done)
  })
})
