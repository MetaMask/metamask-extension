const ObservableStore = require('obs-store')
const ConfigManager = require('../../../app/scripts/lib/config-manager')
const IdStoreMigrator = require('../../../app/scripts/lib/idStore-migrator')
const SimpleKeyring = require('eth-simple-keyring')
const normalize = require('eth-sig-util').normalize

const oldStyleVault = require('../mocks/oldVault.json').data
const badStyleVault = require('../mocks/badVault.json').data

const PASSWORD = '12345678'
const FIRST_ADDRESS = '0x4dd5d356c5A016A220bCD69e82e5AF680a430d00'.toLowerCase()
const BAD_STYLE_FIRST_ADDRESS = '0xac39b311dceb2a4b2f5d8461c1cdaf756f4f7ae9'
const SEED = 'fringe damage bounce extend tunnel afraid alert sound all soldier all dinner'

QUnit.module('Old Style Vaults', {
  beforeEach: function () {
    let managers = managersFromInitState(oldStyleVault)

    this.configManager = managers.configManager
    this.migrator = managers.migrator
  }
})

QUnit.test('migrator:isInitialized', function (assert) {
  assert.ok(this.migrator)
})

QUnit.test('migrator:migratedVaultForPassword', function (assert) {
  var done = assert.async()

  this.migrator.migratedVaultForPassword(PASSWORD)
  .then((result) => {
    assert.ok(result, 'migratedVaultForPassword returned result')
    const { serialized, lostAccounts } = result
    assert.equal(serialized.data.mnemonic, SEED, 'seed phrase recovered')
    assert.equal(lostAccounts.length, 0, 'no lost accounts')
    done()
  })
})

QUnit.module('Old Style Vaults with bad HD seed', {
  beforeEach: function () {
    let managers = managersFromInitState(badStyleVault)

    this.configManager = managers.configManager
    this.migrator = managers.migrator
  }
})

QUnit.test('migrator:migratedVaultForPassword', function (assert) {
  var done = assert.async()

  this.migrator.migratedVaultForPassword(PASSWORD)
  .then((result) => {
    assert.ok(result, 'migratedVaultForPassword returned result')
    const { serialized, lostAccounts } = result

    assert.equal(lostAccounts.length, 1, 'one lost account')
    assert.equal(lostAccounts[0].address, '0xe15D894BeCB0354c501AE69429B05143679F39e0'.toLowerCase())
    assert.ok(lostAccounts[0].privateKey, 'private key exported')

    var lostAccount = lostAccounts[0]
    var privateKey = lostAccount.privateKey

    var simple = new SimpleKeyring()
    simple.deserialize([privateKey])
    .then(() => {
      return simple.getAccounts()
    })
    .then((accounts) => {
      assert.equal(normalize(accounts[0]), lostAccount.address, 'recovered address.')
      done()
    })
    .catch((reason) => {
      assert.ifError(reason)
      done(reason)
    })
  })
})

function managersFromInitState(initState){

  let configManager = new ConfigManager({
    store: new ObservableStore(initState),
  })

  let migrator = new IdStoreMigrator({
    configManager: configManager,
  })

  return { configManager, migrator }
}
