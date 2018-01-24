const assert = require('assert')
const sinon = require('sinon')

const KEYS_TO_SYNC = ['KeyringController', 'PreferencesController']
const mockSyncGetResult = 123
const syncGetStub = sinon.stub().callsFake((str, cb) => cb(mockSyncGetResult))
const syncSetStub = sinon.stub().callsFake((str, cb) => cb())

window.storage = {
  sync: {
    get: syncGetStub,
    set: syncSetStub,
  },
}
window.runtime = {}
const ExtensionStore = require('../../app/scripts/lib/extension-store')

describe('Extension Store', function () {
  let extensionStore

  beforeEach(function () {
    extensionStore = new ExtensionStore()
  })

  describe('#fetch', function () {
    it('should return a promise', function () {
      const extensionStoreFetchResult = extensionStore.fetch()
      assert.ok(Promise.resolve(extensionStoreFetchResult) === extensionStoreFetchResult)
    })
    it('after promise resolution, should have loaded the proper data from the extension', function (done) {
      extensionStore.fetch()
        .then((result) => {
          assert.deepEqual(syncGetStub.getCall(0).args[0], KEYS_TO_SYNC.slice(0))
          assert.equal(result, mockSyncGetResult)
          done()
        })
    })
  })

  describe('#sync', function () {
    it('should return a promise', function () {
      const extensionStoreSyncResult = extensionStore.sync()
      assert.ok(Promise.resolve(extensionStoreSyncResult) === extensionStoreSyncResult)
    })
    it('after promise resolution, should have synced the proper data from the extension', function (done) {
      const mockState = {
        data: {
          KeyringController: 5,
          PreferencesController: 6,
          someOtherData: 7
        },
        someOtherProp: {
          evenMoreData: 8,
        },
      }
      const expectedDataToSync = {
        KeyringController: 5,
        PreferencesController: 6,
      }
      extensionStore.sync(mockState)
        .then(() => {
          assert.deepEqual(syncSetStub.getCall(0).args[0], expectedDataToSync)
          done()
        })
    })
  })
})
