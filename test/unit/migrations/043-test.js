import assert from 'assert'
import migration43 from '../../../app/scripts/migrations/043'

describe('migration #43', function() {
  it('should update the version metadata', function(done) {
    const oldStorage = {
      meta: {
        version: 42,
      },
      data: {},
    }

    migration43
      .migrate(oldStorage)
      .then(newStorage => {
        assert.deepEqual(newStorage.meta, {
          version: 43,
        })
        done()
      })
      .catch(done)
  })

  it('should set migratedToTethys to true and cleanup TransactionController.transactions and NetworkController', function(done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          migratedToTethys: false,
        },
        NetworkController: { chainId: 2 },
        TransactionController: {
          transactions: [0, 1, 2],
        },
      },
    }

    migration43
      .migrate(oldStorage)
      .then(newStorage => {
        assert.deepEqual(newStorage.data.PreferencesController, {
          migratedToTethys: true,
        })
        assert.deepEqual(newStorage.data.TransactionController, {
          transactions: [],
        })
        assert.deepEqual(newStorage.data.NetworkController, {})
        done()
      })
      .catch(done)
  })
})
