import assert from 'assert'
import firstTimeState from '../../../app/scripts/first-time-state'
import migration26 from '../../../app/scripts/migrations/026'

const oldStorage = {
  meta: { version: 25 },
  data: {
    PreferencesController: {},
    KeyringController: {
      walletNicknames: {
        '0x1e77e2': 'Test Account 1',
        '0x7e57e2': 'Test Account 2',
      },
    },
  },
}

describe('migration #26', function () {
  it('should move the identities from KeyringController', function (done) {
    migration26
      .migrate(oldStorage)
      .then((newStorage) => {
        const { identities } = newStorage.data.PreferencesController
        assert.deepEqual(identities, {
          '0x1e77e2': { name: 'Test Account 1', address: '0x1e77e2' },
          '0x7e57e2': { name: 'Test Account 2', address: '0x7e57e2' },
        })
        assert.strictEqual(
          newStorage.data.KeyringController.walletNicknames,
          undefined,
        )
        done()
      })
      .catch(done)
  })

  it('should successfully migrate first time state', function (done) {
    migration26
      .migrate({
        meta: {},
        data: firstTimeState,
      })
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, migration26.version)
        done()
      })
      .catch(done)
  })
})
