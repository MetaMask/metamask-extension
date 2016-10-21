var assert = require('assert')
var KeyringController = require('../../app/scripts/keyring-controller')
var configManagerGen = require('../lib/mock-config-manager')
const ethUtil = require('ethereumjs-util')
const async = require('async')
const mockEncryptor = require('../lib/mock-encryptor')

describe('KeyringController', function() {

  let keyringController
  let password = 'password123'
  let entropy = 'entripppppyy duuude'
  let seedWords
  let accounts = []
  let originalKeystore

  beforeEach(function() {
    window.localStorage = {} // Hacking localStorage support into JSDom

    keyringController = new KeyringController({
      configManager: configManagerGen(),
      ethStore: {
        addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
      },
    })

    // Stub out the browser crypto for a mock encryptor.
    // Browser crypto is tested in the integration test suite.
    keyringController.encryptor = mockEncryptor
  })

  describe('#createNewVault', function () {
    it('should set a vault on the configManager', function(done) {
      assert(!keyringController.configManager.getVault(), 'no previous vault')
      keyringController.createNewVault(password, null, function (err, state) {
        assert.ifError(err)
        const vault = keyringController.configManager.getVault()
        assert(vault, 'vault created')

        done()
      })
    })
  })

})





