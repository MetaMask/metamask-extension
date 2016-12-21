var KeyringController = require('../../../app/scripts/keyring-controller')
var ConfigManager = require('../../../app/scripts/lib/config-manager')

var oldStyleVault = require('../mocks/oldVault.json')
var badStyleVault = require('../mocks/badVault.json')

var STORAGE_KEY = 'metamask-config'
var PASSWORD = '12345678'
var FIRST_ADDRESS = '0x4dd5d356c5A016A220bCD69e82e5AF680a430d00'.toLowerCase()

var BAD_STYLE_FIRST_ADDRESS = '0xac39b311dceb2a4b2f5d8461c1cdaf756f4f7ae9'


QUnit.module('Old Style Vaults', {
  beforeEach: function () {
    window.localStorage[STORAGE_KEY] = JSON.stringify(oldStyleVault)

    this.configManager = new ConfigManager({
      loadData: () => { return JSON.parse(window.localStorage[STORAGE_KEY]) },
      setData: (data) => { window.localStorage[STORAGE_KEY] = JSON.stringify(data) },
    })

    this.keyringController = new KeyringController({
      configManager: this.configManager,
      getNetwork: () => { return '2' },
      txManager: {
        getTxList: () => [],
        getUnapprovedTxList: () => []
      },
    })

    this.ethStore = {
      addAccount: () => {},
      removeAccount: () => {},
    }

    this.keyringController.setStore(this.ethStore)
  }
})

QUnit.test('keyringController:isInitialized', function (assert) {
  assert.ok(this.keyringController.getState().isInitialized)
})

QUnit.test('keyringController:submitPassword', function (assert) {
  var done = assert.async()

  this.keyringController.submitPassword(PASSWORD)
  .then((state) => {
    assert.ok(state.identities[FIRST_ADDRESS])
    assert.equal(state.lostAccounts.length, 0, 'no lost accounts')
    done()
  })
})

QUnit.test('keyringController:setLocked', function (assert) {
  var done = assert.async()
  var self = this

  this.keyringController.setLocked()
  .then(function() {
    assert.notOk(self.keyringController.password, 'password should be deallocated')
    assert.deepEqual(self.keyringController.keyrings, [], 'keyrings should be deallocated')
    done()
  })
  .catch((reason) => {
    assert.ifError(reason)
    done()
  })
})

QUnit.module('Old Style Vaults with bad HD seed', {
  beforeEach: function () {
    window.localStorage[STORAGE_KEY] = JSON.stringify(badStyleVault)

    this.configManager = new ConfigManager({
      loadData: () => { return JSON.parse(window.localStorage[STORAGE_KEY]) },
      setData: (data) => { window.localStorage[STORAGE_KEY] = JSON.stringify(data) },
    })

    this.keyringController = new KeyringController({
      configManager: this.configManager,
      getNetwork: () => { return '2' },
    })

    this.ethStore = {
      addAccount: () => {},
      removeAccount: () => {},
    }

    this.keyringController.setStore(this.ethStore)
  }
})

QUnit.test('keyringController:isInitialized', function (assert) {
  assert.ok(this.keyringController.getState().isInitialized, 'vault is initialized')
})

QUnit.test('keyringController:submitPassword', function (assert) {
  var done = assert.async()

  this.keyringController.submitPassword(PASSWORD)
  .then((state) => {
    assert.ok(state.identities[BAD_STYLE_FIRST_ADDRESS])
    assert.equal(state.lostAccounts.length, 1, 'one lost account')
    assert.equal(state.lostAccounts[0], '0xe15D894BeCB0354c501AE69429B05143679F39e0'.toLowerCase())
    assert.deepEqual(this.configManager.getLostAccounts(), state.lostAccounts, 'persisted')
    done()
  })
})

QUnit.test('keyringController:setLocked', function (assert) {
  var done = assert.async()
  var self = this

  this.keyringController.setLocked()
  .then(function() {
    assert.notOk(self.keyringController.password, 'password should be deallocated')
    assert.deepEqual(self.keyringController.keyrings, [], 'keyrings should be deallocated')
    done()
  })
  .catch((reason) => {
    assert.ifError(reason)
    done()
  })
})
