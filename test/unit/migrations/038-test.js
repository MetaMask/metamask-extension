import { strict as assert } from 'assert'
import migration38 from '../../../app/scripts/migrations/038'

describe('migration #38', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 37,
      },
      data: {},
    }

    migration38
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 38,
        })
        done()
      })
      .catch(done)
  })

  it('should add a fullScreenVsPopup property set to either "control" or "fullScreen"', function (done) {
    const oldStorage = {
      meta: {},
      data: {},
    }

    migration38
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.equal(
          newStorage.data.ABTestController.abTests.fullScreenVsPopup,
          'control',
        )
        done()
      })
      .catch(done)
  })

  it('should leave the fullScreenVsPopup property unchanged if it exists', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        ABTestController: {
          abTests: {
            fullScreenVsPopup: 'fullScreen',
          },
        },
      },
    }

    migration38
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.ABTestController, {
          abTests: {
            fullScreenVsPopup: 'fullScreen',
          },
        })
        done()
      })
      .catch(done)
  })
})
