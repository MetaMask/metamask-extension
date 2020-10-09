import assert from 'assert'
import migration42 from '../../../app/scripts/migrations/042'

describe('migration #42', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 41,
      },
      data: {},
    }

    migration42
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 42,
        })
        done()
      })
      .catch(done)
  })

  it('should set advancedInlineGas to false', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          featureFlags: {
            advancedInlineGas: true,
          },
        },
      },
    }

    migration42
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.PreferencesController, {
          migratedAdvancedInlineGas: true,
          featureFlags: {
            advancedInlineGas: false,
          },
        })
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if migratedAdvancedInlineGas is already set to true', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          migratedAdvancedInlineGas: true,
          featureFlags: {
            advancedInlineGas: true,
          },
        },
      },
    }

    migration42
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })

  it('should NOT change any state if PreferencesController is missing', function (done) {
    const oldStorage = {
      meta: {},
      data: {},
    }

    migration42
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data)
        done()
      })
      .catch(done)
  })
})
