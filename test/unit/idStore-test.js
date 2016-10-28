const async = require('async')
const assert = require('assert')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const configManagerGen = require('../lib/mock-config-manager')
const delegateCallCode = require('../lib/example-code.json').delegateCallCode
const IdentityStore = require('../../app/scripts/lib/idStore')

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
   const salt = 'lightwalletSalt'

    let password = 'secret!'
    let accounts = {}
    let idStore

    var assertions = [
      {
        seed: 'picnic injury awful upper eagle junk alert toss flower renew silly vague',
        account: '0x5d8de92c205279c10e5669f797b853ccef4f739a',
      },
      {
        seed: 'radar blur cabbage chef fix engine embark joy scheme fiction master release',
        account: '0xe15d894becb0354c501ae69429b05143679f39e0',
      },
      {
         seed: 'phone coyote caught pattern found table wedding list tumble broccoli chief swing',
        account: '0xb0e868f24bc7fec2bce2efc2b1c344d7569cd9d2',
      },
      {
        seed: 'recycle tag bird palace blue village anxiety census cook soldier example music',
        account: '0xab34a45920afe4af212b96ec51232aaa6a33f663',
      },
      {
        seed: 'half glimpse tape cute harvest sweet bike voyage actual floor poet lazy',
        account: '0x28e9044597b625ac4beda7250011670223de43b2',
      },
      {
        seed: 'flavor tiger carpet motor angry hungry document inquiry large critic usage liar',
        account: '0xb571be96558940c4e9292e1999461aa7499fb6cd',
      },
    ]

    before(function() {
      window.localStorage = {} // Hacking localStorage support into JSDom

      idStore = new IdentityStore({
        configManager: configManagerGen(),
        ethStore: {
          addAccount(acct) { accounts[acct] = acct},
          del(acct) { delete accounts[acct] },
        },
      })
    })

    it('should enforce seed compliance with TestRPC', function (done) {
      this.timeout(10000)
      const tests = assertions.map((assertion) => {
        return function (cb) {

          idStore.recoverFromSeed(password, assertion.seed, (err) => {
            assert.ifError(err)

            var expected = assertion.account.toLowerCase()
            var received = accounts[expected].toLowerCase()
            assert.equal(received, expected)

            idStore.tryPassword(password, function (err) {

              assert.ok(idStore._isUnlocked(), 'should unlock the id store')

              idStore.submitPassword(password, function(err, account) {
                assert.ifError(err)
                assert.equal(account, expected)
                assert.equal(Object.keys(idStore._getAddresses()).length, 1, 'only one account on restore')
                cb()
              })
            })
          })
        }
      })

      async.series(tests, function(err, results) {
        assert.ifError(err)
        done()
      })
    })
  })

  describe('#addGasBuffer', function() {
    const idStore = new IdentityStore({
      configManager: configManagerGen(),
      ethStore: {
        addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
      },
    })

    const gas = '0x01'
    const bnGas = new BN(gas, 16)
    const result = idStore.addGasBuffer(gas)
    const bnResult = new BN(result, 16)

    assert.ok(bnResult.gt(gas), 'added more gas as buffer.')
    assert.equal(result.indexOf('0x'), 0, 'include hex prefix')
  })

  describe('#checkForDelegateCall', function() {
    const idStore = new IdentityStore({
      configManager: configManagerGen(),
      ethStore: {
        addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
      },
    })

    var result = idStore.checkForDelegateCall(delegateCallCode)
    assert.equal(result, true, 'no delegate call in provided code')
  })
})
