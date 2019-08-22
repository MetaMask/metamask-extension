const assert = require('assert')
const migration37 = require('../../../app/scripts/migrations/037')

describe('migration #37', () => {
  it('should update the version metadata', (done) => {
    const oldStorage = {
      meta: {
        version: 36,
      },
      data: {},
    }

    migration37.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 37,
        })
        done()
      })
      .catch(done)
  })

  it('should delete computedBalances', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'computedBalances': {
        },
      },
    }

    migration37.migrate(oldStorage)
      .then((newStorage) => {
        assert.equal(newStorage.data.computedBalances, undefined)
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if computedBalances is missing', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {},
    }

    migration37.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })
})
