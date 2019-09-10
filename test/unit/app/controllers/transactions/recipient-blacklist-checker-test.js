const assert = require('assert')
const recipientBlackListChecker = require('../../../../../app/scripts/controllers/transactions/lib/recipient-blacklist-checker')
const {
  ROPSTEN_CODE,
  RINKEBY_CODE,
  KOVAN_CODE,
  GOERLI_CODE,
} = require('../../../../../app/scripts/controllers/network/enums')

const KeyringController = require('eth-keyring-controller')

describe('Recipient Blacklist Checker', function () {

  let publicAccounts

  before(async function () {
    const damnedMnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
    const keyringController = new KeyringController({})
    const Keyring = keyringController.getKeyringClassForType('HD Key Tree')
    const opts = {
      mnemonic: damnedMnemonic,
      numberOfAccounts: 10,
    }
    const keyring = new Keyring(opts)
    publicAccounts = await keyring.getAccounts()
  })

  describe('#checkAccount', function () {
    it('does not fail on test networks', function () {
      let callCount = 0
      const networks = [ROPSTEN_CODE, RINKEBY_CODE, KOVAN_CODE, GOERLI_CODE]
      for (const networkId in networks) {
        publicAccounts.forEach((account) => {
          recipientBlackListChecker.checkAccount(networkId, account)
          callCount++
        })
      }
      assert.equal(callCount, 40)
    })

    it('fails on mainnet', function () {
      const mainnetId = 1
      let callCount = 0
      publicAccounts.forEach((account) => {
        try {
          recipientBlackListChecker.checkAccount(mainnetId, account)
          assert.fail('function should have thrown an error')
        } catch (err) {
          assert.equal(err.message, 'Recipient is a public account')
        }
        callCount++
      })
      assert.equal(callCount, 10)
    })

    it('fails for public account - uppercase', function () {
      const mainnetId = 1
      const publicAccount = '0X0D1D4E623D10F9FBA5DB95830F7D3839406C6AF2'
      try {
        recipientBlackListChecker.checkAccount(mainnetId, publicAccount)
        assert.fail('function should have thrown an error')
      } catch (err) {
        assert.equal(err.message, 'Recipient is a public account')
      }
    })

    it('fails for public account - lowercase', async function () {
      const mainnetId = 1
      const publicAccount = '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2'
      try {
        await recipientBlackListChecker.checkAccount(mainnetId, publicAccount)
        assert.fail('function should have thrown an error')
      } catch (err) {
        assert.equal(err.message, 'Recipient is a public account')
      }
    })
  })
})
