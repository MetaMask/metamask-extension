const assert = require('assert')
const migration38 = require('../../../app/scripts/migrations/038')

describe('migration #38', () => {
  it('should update the version metadata', (done) => {
    const oldStorage = {
      'meta': {
        'version': 37,
      },
      'data': {},
    }

    migration38.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 38,
        })
        done()
      })
      .catch(done)
  })

  it('should add a fullScreenVsPopup property set to either "control" or "fullScreen"', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {},
    }

    migration38.migrate(oldStorage)
      .then((newStorage) => {
        assert(newStorage.data.ABTestController.abTests.fullScreenVsPopup.match(/control|fullScreen/))
        done()
      })
      .catch(done)
  })

  it('should leave the fullScreenVsPopup property unchanged if it exists', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'ABTestController': {
          abTests: {
            'fullScreenVsPopup': 'fullScreen',
          },
        },
      },
    }

    migration38.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.ABTestController, {
          abTests: {
            'fullScreenVsPopup': 'fullScreen',
          },
        })
        done()
      })
      .catch(done)
  })
})
