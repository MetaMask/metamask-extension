var KeyringController = require('../../../app/scripts/keyring-controller')
var ConfigManager = require('../../../app/scripts/lib/config-manager')

var oldStyleVault = require('../mocks/oldVault.json')

var STORAGE_KEY = 'metamask-config'
var PASSWORD = '12345678'
var FIRST_ADDRESS = '0x4dd5d356c5A016A220bCD69e82e5AF680a430d00'.toLowerCase()


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

  this.keyringController.submitPassword(PASSWORD, (err, state) => {
    assert.notOk(err)
    assert.ok(state.identities[FIRST_ADDRESS])
    done()
  })
})
