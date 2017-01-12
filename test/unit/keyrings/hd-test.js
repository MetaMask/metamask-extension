const assert = require('assert')
const extend = require('xtend')
const sinon = require('sinon')
const HdKeyring = require('../../../app/scripts/keyrings/hd')

// Sample account:
const privKeyHex = 'b8a9c05beeedb25df85f8d641538cbffedf67216048de9c678ee26260eb91952'

const sampleMnemonic = 'finish oppose decorate face calm tragic certain desk hour urge dinosaur mango'
const firstAcct = '1c96099350f13d558464ec79b9be4445aa0ef579'
const secondAcct = '1b00aed43a693f3a957f9feb5cc08afa031e37a0'



describe('hd-keyring', function() {

  let keyring
  beforeEach(function() {
    keyring = new HdKeyring()
    this.sinon = sinon.sandbox.create()
  })

  afterEach(function() {
    this.sinon.restore()
  })

  describe('constructor', function(done) {
    keyring = new HdKeyring({
      mnemonic: sampleMnemonic,
      numberOfAccounts: 2,
    })

    const accounts = keyring.getAccounts()
    .then((accounts) => {
      assert.equal(accounts[0], firstAcct)
      assert.equal(accounts[1], secondAcct)
      done()
    })
  })

  describe('Keyring.type', function() {
    it('is a class property that returns the type string.', function() {
      const type = HdKeyring.type
      assert.equal(typeof type, 'string')
    })
  })

  describe('#type', function() {
    it('returns the correct value', function() {
      const type = keyring.type
      const correct = HdKeyring.type
      assert.equal(type, correct)
    })
  })

  describe('#serialize empty wallets.', function() {
    it('serializes a new mnemonic', function() {
      keyring.serialize()
      .then((output) => {
        assert.equal(output.numberOfAccounts, 0)
        assert.equal(output.mnemonic, null)
      })
    })
  })

  describe('#deserialize a private key', function() {
    it('serializes what it deserializes', function(done) {
      keyring.deserialize({
        mnemonic: sampleMnemonic,
        numberOfAccounts: 1
      })
      .then(() => {
        assert.equal(keyring.wallets.length, 1, 'restores two accounts')
        return keyring.addAccounts(1)
      }).then(() => {
        return keyring.getAccounts()
      }).then((accounts) => {
        assert.equal(accounts[0], firstAcct)
        assert.equal(accounts[1], secondAcct)
        assert.equal(accounts.length, 2)

        return keyring.serialize()
      }).then((serialized) => {
        assert.equal(serialized.mnemonic, sampleMnemonic)
        done()
      })
    })
  })

  describe('#addAccounts', function() {
    describe('with no arguments', function() {
      it('creates a single wallet', function(done) {
        keyring.addAccounts()
        .then(() => {
          assert.equal(keyring.wallets.length, 1)
          done()
        })
      })
    })

    describe('with a numeric argument', function() {
      it('creates that number of wallets', function(done) {
        keyring.addAccounts(3)
        .then(() => {
          assert.equal(keyring.wallets.length, 3)
          done()
        })
      })
    })
  })

  describe('#getAccounts', function() {
    it('calls getAddress on each wallet', function(done) {

      // Push a mock wallet
      const desiredOutput = 'foo'
      keyring.wallets.push({
        getAddress() {
          return {
            toString() {
              return desiredOutput
            }
          }
        }
      })

      const output = keyring.getAccounts()
      .then((output) => {
        assert.equal(output[0], desiredOutput)
        assert.equal(output.length, 1)
        done()
      })
    })
  })

  describe('#restoreManyAccounts', function () {
    it('restores only one account if it is a fresh HD tree.', function (done) {
      var emptyQuery = sinon.stub()
      emptyQuery.returns('0')


      keyring.deserialize({
        mnemonic: sampleMnemonic,
        query: emptyQuery,
      })
      .then(() => { assert.equal(keyring.wallets.length, 1, 'needed to restore one account') })
    })

    it('restores only one acccount when only the first account has a balance.', function (done) {
      var singleQuery = sinon.stub()
      singleQuery.onFirstCall().returns('2000000000000000000')
      singleQuery.returns('0')

      keyring.deserialize({
        mnemonic: sampleMnemonic,
        query: singleQuery,
      })
      .then(() => { assert.equal(keyring.wallets.length, 1, 'needed to restore one account') })
    })

    it('restores three accounts when the third account has a balance.', function (done) {
      var thirdQuery = sinon.stub()
      thirdQuery.onThirdCall().returns('2000000000000000000')
      thirdQuery.returns('0')

      keyring.deserialize({
        mnemonic: sampleMnemonic,
        query: thirdQuery,
      })
      .then(() => { assert.equal(keyring.wallets.length, 3, 'needed to restore three accounts') })
    })

    it('restores twelve accounts when the third and the twelfth have balances.', function (done) {
      var thirdTwelfthQuery = sinon.stub()
      thirdTwelfthQuery.onThirdCall().returns('2000000000000000000')
      thirdTwelfthQuery.onCall(12).returns('2000000000000000000')
      thirdTwelfthQuery.returns('0')

      keyring.deserialize({
        mnemonic: sampleMnemonic,
        query: thirdTwelfthQuery,
      })
      .then(() => { assert.equal(keyring.wallets.length, 12, 'needed to restore twelve accounts') })
    })

    it('restores three accounts when the first three have balances.', function (done) {
      var firstThreeQuery = sinon.stub()
      firstThreeQuery.onFirstCall().returns('2000000000000000000')
      firstThreeQuery.onSecondCcall().returns('2000000000000000000')
      firstThreeQuery.onThirdCall().returns('2000000000000000000')
      firstThreeQuery.returns('0')

      keyring.deserialize({
        mnemonic: firstThreeMnemonic,
        query: firstThreeQuery,
      })
      .then(() => { assert.equal(keyring.wallets.length, 3, 'needed to restore three accounts') })
    })
  })
})
