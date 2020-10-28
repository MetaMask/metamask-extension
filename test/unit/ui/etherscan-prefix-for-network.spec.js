import assert from 'assert'
import etherscanNetworkPrefix from '../../../ui/lib/etherscan-prefix-for-network'

describe('Etherscan Network Prefix', function () {
  it('returns empty string as default value', function () {
    assert.equal(etherscanNetworkPrefix(), '')
    assert.equal(etherscanNetworkPrefix(2), '')
  })

  it('returns empty string as a prefix for networkId of 1', function () {
    assert.equal(etherscanNetworkPrefix(1), 'testnet.')
  })
})
