import assert from 'assert'
import getAccountLink from '../../../ui/lib/account-link'

describe('Account link', function () {
  describe('getAccountLink', function () {
    it('should return the correct block explorer url for an account', function () {
      const tests = [
        {
          expected: 'https://etherscan.io/address/0xabcd',
          network: 1,
          address: '0xabcd',
        },
        {
          expected: 'https://ropsten.etherscan.io/address/0xdef0',
          network: 3,
          address: '0xdef0',
          rpcPrefs: {},
        },
        {
          // test handling of `blockExplorerUrl` for a custom RPC
          expected: 'https://block.explorer/address/0xabcd',
          network: 31,
          address: '0xabcd',
          rpcPrefs: {
            blockExplorerUrl: 'https://block.explorer',
          },
        },
        {
          // test handling of trailing `/` in `blockExplorerUrl` for a custom RPC
          expected: 'https://another.block.explorer/address/0xdef0',
          network: 33,
          address: '0xdef0',
          rpcPrefs: {
            blockExplorerUrl: 'https://another.block.explorer/',
          },
        },
      ]

      tests.forEach(({ expected, address, network, rpcPrefs }) => {
        assert.equal(getAccountLink(address, network, rpcPrefs), expected)
      })
    })
  })
})
