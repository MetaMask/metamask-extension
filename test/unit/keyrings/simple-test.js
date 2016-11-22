const assert = require('assert')
const extend = require('xtend')
const SimpleKeyring = require('../../../app/scripts/keyrings/simple')
const TYPE_STR = 'Simple Key Pair'

// Sample account:
const privKeyHex = 'b8a9c05beeedb25df85f8d641538cbffedf67216048de9c678ee26260eb91952'

describe('simple-keyring', function() {

  let keyring
  beforeEach(function() {
    keyring = new SimpleKeyring()
  })

  describe('Keyring.type', function() {
    it('is a class property that returns the type string.', function() {
      const type = SimpleKeyring.type
      assert.equal(type, TYPE_STR)
    })
  })

  describe('#type', function() {
    it('returns the correct value', function() {
      const type = keyring.type
      assert.equal(type, TYPE_STR)
    })
  })

  describe('#serialize empty wallets.', function() {
    it('serializes an empty array', function() {
      const output = keyring.serialize()
      assert.deepEqual(output, [])
    })
  })

  describe('#deserialize a private key', function() {
    it('serializes what it deserializes', function() {
      keyring.deserialize([privKeyHex])
      assert.equal(keyring.wallets.length, 1, 'has one wallet')

      const serialized = keyring.serialize()
      assert.equal(serialized[0], privKeyHex)
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
