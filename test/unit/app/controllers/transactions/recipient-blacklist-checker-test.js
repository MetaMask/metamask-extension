import { strict as assert } from 'assert'
import { throwIfAccountIsBlacklisted } from '../../../../../app/scripts/controllers/transactions/lib/recipient-blacklist-checker'
import { ROPSTEN_NETWORK_ID, RINKEBY_NETWORK_ID, KOVAN_NETWORK_ID, GOERLI_NETWORK_ID } from '../../../../../app/scripts/controllers/network/enums'

describe('Recipient Blacklist Checker', function () {
  describe('#throwIfAccountIsBlacklisted', function () {
    // Accounts from Ganache's original default seed phrase
    const publicAccounts = [
      '0x627306090abab3a6e1400e9345bc60c78a8bef57',
      '0xf17f52151ebef6c7334fad080c5704d77216b732',
      '0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef',
      '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
      '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2',
      '0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e',
      '0x2191ef87e392377ec08e7c08eb105ef5448eced5',
      '0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5',
      '0x6330a553fc93768f612722bb8c2ec78ac90b3bbc',
      '0x5aeda56215b167893e80b4fe645ba6d5bab767de',
    ]

    it('does not fail on test networks', function () {
      const networks = [ROPSTEN_NETWORK_ID, RINKEBY_NETWORK_ID, KOVAN_NETWORK_ID, GOERLI_NETWORK_ID]
      for (const networkId of networks) {
        for (const account of publicAccounts) {
          assert.doesNotThrow(() => throwIfAccountIsBlacklisted(networkId, account))
        }
      }
    })

    it('fails on mainnet', function () {
      for (const account of publicAccounts) {
        assert.throws(
          () => throwIfAccountIsBlacklisted(1, account),
          { message: 'Recipient is a public account' },
        )
      }
    })

    it('fails for public account - uppercase', function () {
      assert.throws(
        () => throwIfAccountIsBlacklisted(1, '0X0D1D4E623D10F9FBA5DB95830F7D3839406C6AF2'),
        { message: 'Recipient is a public account' },
      )
    })

    it('fails for public account - lowercase', function () {
      assert.throws(
        () => throwIfAccountIsBlacklisted(1, '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2'),
        { message: 'Recipient is a public account' },
      )
    })
  })
})
