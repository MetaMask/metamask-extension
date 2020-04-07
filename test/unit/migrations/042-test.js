import assert from 'assert'
import migration42 from '../../../app/scripts/migrations/042'

describe('migration #42', function () {

  it('should update the version metadata', function (done) {
    const oldStorage = {
      'meta': {
        'version': 41,
      },
      'data': {},
    }

    migration42.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 42,
        })
        done()
      })
      .catch(done)
  })

  it('should set connectedStatusPopoverHasBeenShown to false', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
          bar: 'baz',
        },
        foo: 'bar',
      },
    }

    migration42.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          AppStateController: {
            connectedStatusPopoverHasBeenShown: false,
            bar: 'baz',
          },
          foo: 'bar',
        })
        done()
      })
      .catch(done)
  })

  it('should do nothing if no AppStateController key', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    }

    migration42.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          foo: 'bar',
        })
        done()
      })
      .catch(done)
  })
})
