const assert = require('assert')
const clone = require('clone')
const KeyringController = require('eth-keyring-controller')
const firstTimeState = require('../../app/scripts/first-time-state')
const seedPhraseVerifier = require('../../app/scripts/lib/seed-phrase-verifier')
const mockEncryptor = require('../lib/mock-encryptor')

describe('SeedPhraseVerifier', function () {

  describe('verifyAccounts', function () {

    let password = 'passw0rd1'
    let hdKeyTree = 'HD Key Tree'

    let keyringController
    beforeEach(function () {
      keyringController = new KeyringController({
        initState: clone(firstTimeState),
        encryptor: mockEncryptor,
      })

      assert(keyringController)
    })

    it('should be able to verify created account with seed words', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      let serialized = await primaryKeyring.serialize()
      let seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)
    
      let result = await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords)
    })

    it('should be able to verify created account (upper case) with seed words', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)
      let upperCaseAccounts = [createdAccounts[0].toUpperCase()]

      let serialized = await primaryKeyring.serialize()
      let seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)
    
      let result = await seedPhraseVerifier.verifyAccounts(upperCaseAccounts, seedWords)
    })

    it('should be able to verify created account (lower case) with seed words', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)
      let lowerCaseAccounts = [createdAccounts[0].toLowerCase()]

      let serialized = await primaryKeyring.serialize()
      let seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)
    
      let result = await seedPhraseVerifier.verifyAccounts(lowerCaseAccounts, seedWords)
    })

    it('should return error with good but different seed words', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      let serialized = await primaryKeyring.serialize()
      let seedWords = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
      
      try { 
        let result = await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords)
        assert.fail("Should reject")
      } catch (err) {
        assert.ok(err.message.indexOf('Not identical accounts!') >= 0, 'Wrong error message')
      }
    })

    it('should return error with undefined existing accounts', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      let serialized = await primaryKeyring.serialize()
      let seedWords = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'

      try { 
        let result = await seedPhraseVerifier.verifyAccounts(undefined, seedWords)
        assert.fail("Should reject")
      } catch (err) {
        assert.equal(err.message, 'No created accounts defined.')
      }
    })

    it('should return error with empty accounts array', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 1)

      let serialized = await primaryKeyring.serialize()
      let seedWords = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'

      try { 
        let result = await seedPhraseVerifier.verifyAccounts([], seedWords)
        assert.fail("Should reject")
      } catch (err) {
        assert.equal(err.message, 'No created accounts defined.')
      }
    })

    it('should be able to verify more than one created account with seed words', async function () {

      let vault = await keyringController.createNewVaultAndKeychain(password)
      
      let primaryKeyring = keyringController.getKeyringsByType(hdKeyTree)[0]

      const keyState = await keyringController.addNewAccount(primaryKeyring)
      const keyState2 = await keyringController.addNewAccount(primaryKeyring)

      let createdAccounts = await primaryKeyring.getAccounts()
      assert.equal(createdAccounts.length, 3)

      let serialized = await primaryKeyring.serialize()
      let seedWords = serialized.mnemonic
      assert.notEqual(seedWords.length, 0)
    
      let result = await seedPhraseVerifier.verifyAccounts(createdAccounts, seedWords)
    })
  })
})
