var assert = require('assert')
var IdentityStore = require('../../app/scripts/lib/idStore')
var configManagerGen = require('../lib/mock-config-manager')
const ethUtil = require('ethereumjs-util')

describe('IdentityStore', function() {

  describe('#createNewVault', function () {
    let idStore
    let password = 'password123'
    let entropy = 'entripppppyy duuude'
    let seedWords
    let accounts = []
    let originalKeystore

    before(function(done) {
      window.localStorage = {} // Hacking localStorage support into JSDom

      idStore = new IdentityStore({
        configManager: configManagerGen(),
        ethStore: {
          addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
        },
      })

      idStore.createNewVault(password, entropy, (err, seeds) => {
        assert.ifError(err, 'createNewVault threw error')
        seedWords = seeds
        originalKeystore = idStore._idmgmt.keyStore
        done()
      })
    })

    describe('#recoverFromSeed', function() {
      let newAccounts = []

      before(function() {
        window.localStorage = {} // Hacking localStorage support into JSDom

        idStore = new IdentityStore({
          configManager: configManagerGen(),
          ethStore: {
            addAccount(acct) { newAccounts.push(ethUtil.addHexPrefix(acct)) },
          },
        })
      })

      it('should return the expected keystore', function (done) {

        idStore.recoverFromSeed(password, seedWords, (err) => {
          assert.ifError(err)

          let newKeystore = idStore._idmgmt.keyStore
          assert.equal(newAccounts[0], accounts[0])
          done()
        })
      })
    })
  })

  describe('#recoverFromSeed BIP44 compliance', function() {
    let seedWords =  'picnic injury awful upper eagle junk alert toss flower renew silly vague'
    let firstAccount = '0x5d8de92c205279c10e5669f797b853ccef4f739a'
    const salt = 'lightwalletSalt'

    const secondSeed = 'radar blur cabbage chef fix engine embark joy scheme fiction master release'
    const secondAcct = '0xac39b311dceb2a4b2f5d8461c1cdaf756f4f7ae9'

    let password = 'secret!'
    let accounts = []
    let idStore

    before(function() {
      window.localStorage = {} // Hacking localStorage support into JSDom

      idStore = new IdentityStore({
        configManager: configManagerGen(),
        ethStore: {
          addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
        },
      })
    })

    beforeEach(function() {
      accounts = []
    })

    it('should return the expected first account', function (done) {

      idStore.recoverFromSeed(password, seedWords, (err) => {
        assert.ifError(err)

        let newKeystore = idStore._idmgmt.keyStore

        assert.equal(accounts[0], firstAccount)

        accounts = []
        idStore.recoverFromSeed(password, secondSeed, (err) => {

          let accounts = idStore._getAddresses()
          assert.equal(accounts[0], secondAcct)
          done()
        })
      })
    })

    it('should return the expected second account', function (done) {
      idStore.recoverFromSeed(password, secondSeed, (err) => {
        assert.ifError(err)

        let newKeystore = idStore._idmgmt.keyStore

        assert.equal(accounts[0], firstAccount)
        done()
      })
    })
  })
})
