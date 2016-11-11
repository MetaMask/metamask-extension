const assert = require('assert')
const extend = require('xtend')
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
  })

  describe('constructor', function() {
    keyring = new HdKeyring({
      mnemonic: sampleMnemonic,
      n: 2,
    })

    const accounts = keyring.getAccounts()
    assert.equal(accounts[0], firstAcct)
    assert.equal(accounts[1], secondAcct)
  })

  describe('Keyring.type()', function() {
    it('is a class method that returns the type string.', function() {
      const type = HdKeyring.type()
      assert.equal(typeof type, 'string')
    })
  })

  describe('#type', function() {
    it('returns the correct value', function() {
      const type = keyring.type
      const correct = HdKeyring.type()
      assert.equal(type, correct)
    })
  })

  describe('#serialize empty wallets.', function() {
    it('serializes a new mnemonic', function() {
      const output = keyring.serialize()
      assert.equal(output.n, 0)
      assert.equal(output.mnemonic, null)
    })
  })

  describe('#deserialize a private key', function() {
    it('serializes what it deserializes', function() {
      keyring.deserialize({
        mnemonic: sampleMnemonic,
        n: 1
      })
      assert.equal(keyring.wallets.length, 1, 'restores two accounts')
      keyring.addAccounts(1)

      const accounts = keyring.getAccounts()
      assert.equal(accounts[0], firstAcct)
      assert.equal(accounts[1], secondAcct)
      assert.equal(accounts.length, 2)

      const serialized = keyring.serialize()
      assert.equal(serialized.mnemonic, sampleMnemonic)
    })
  })

  describe('#addAccounts', function() {
    describe('with no arguments', function() {
      it('creates a single wallet', function() {
        keyring.addAccounts()
        assert.equal(keyring.wallets.length, 1)
      })
    })

    describe('with a numeric argument', function() {
      it('creates that number of wallets', function() {
        keyring.addAccounts(3)
        assert.equal(keyring.wallets.length, 3)
      })
    })
  })

  describe('#getAccounts', function() {
    it('calls getAddress on each wallet', function() {

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
      assert.equal(output[0], desiredOutput)
      assert.equal(output.length, 1)
    })
  })
})
