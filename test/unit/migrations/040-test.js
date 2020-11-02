import assert from 'assert'
import migration40 from '../../../app/scripts/migrations/040'

describe('migration #40', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 39,
      },
      data: {},
    }

    migration40
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 40,
        })
        done()
      })
      .catch(done)
  })

  it('should delete ProviderApprovalController storage key', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        ProviderApprovalController: {},
        foo: 'bar',
      },
    }

    migration40
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, { foo: 'bar' })
        done()
      })
      .catch(done)
  })

  it('should do nothing if no ProviderApprovalController storage key', function (done) {
    const oldStorage = {
      meta: {},
      data: { foo: 'bar' },
    }

    migration40
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, { foo: 'bar' })
        done()
      })
      .catch(done)
  })
})
