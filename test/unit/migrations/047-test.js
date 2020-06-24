import assert from 'assert'
import migration47 from '../../../app/scripts/migrations/047'

describe('migration #47', function () {

  it('should update the version metadata', function (done) {
    const oldStorage = {
      'meta': {
        'version': 46,
      },
      'data': {},
    }

    migration47.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 47,
        })
        done()
      })
      .catch(done)
  })

  it('should initialize AlertController state', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    }

    migration47.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          AlertController: {
            alertEnabledness: {
              unconnectedAccount: true,
            },
            unconnectedAccountAlertShownOrigins: {},
          },
          foo: 'bar',
        })
        done()
      })
      .catch(done)
  })
})
