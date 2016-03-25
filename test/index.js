var assert = require('assert')
var IdentityStore = require('../app/scripts/lib/idStore')
var jsdom = require('mocha-jsdom')
jsdom()

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
        addAccount(acct) { accounts.push(acct) },
      })

      idStore.createNewVault(password, entropy, (err, seeds) => {
        seedWords = seeds
        originalKeystore = idStore._idmgmt.keyStore
        done()
      })
    })

    describe('#recoverFromSeed', function() {

      before(function() {
        window.localStorage = {} // Hacking localStorage support into JSDom
        accounts = []

        idStore = new IdentityStore({
          addAccount(acct) { accounts.push(acct) },
        })
      })

      it('should return the expected keystore', function () {

        idStore.recoverFromSeed(password, seedWords, (err) => {
          assert.ifError(err)

          let newKeystore = idStore._idmgmt.keyStore
          assert.equal(newKeystore, originalKeystore)
        })
      })
    })
  })
})
