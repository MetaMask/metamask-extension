import assert from 'assert'
import migration45 from '../../../app/scripts/migrations/045'

describe('migration #45', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 44,
      },
      data: {},
    }

    migration45
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 45,
        })
        done()
      })
      .catch(done)
  })

  it('should update ipfsGateway value if outdated', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          ipfsGateway: 'ipfs.dweb.link',
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    migration45
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          PreferencesController: {
            ipfsGateway: 'dweb.link',
            bar: 'baz',
          },
          foo: 'bar',
        })
        done()
      })
      .catch(done)
  })

  it('should not update ipfsGateway value if custom set', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          ipfsGateway: 'blah',
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    migration45
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          PreferencesController: {
            ipfsGateway: 'blah',
            bar: 'baz',
          },
          foo: 'bar',
        })
        done()
      })
      .catch(done)
  })

  it('should do nothing if no PreferencesController key', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    }

    migration45
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          foo: 'bar',
        })
        done()
      })
      .catch(done)
  })
})
