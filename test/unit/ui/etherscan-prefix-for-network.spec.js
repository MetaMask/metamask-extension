import assert from 'assert'
import etherscanNetworkPrefix from '../../../ui/lib/etherscan-prefix-for-network'

describe('Etherscan Network Prefix', function () {

  it('returns empy string as default value', function () {
    assert.equal(etherscanNetworkPrefix(), '')
  })

  it('returns empty string as a prefix for networkId of 1', function () {
    assert.equal(etherscanNetworkPrefix(1), '')
  })

  it('returns ropsten as prefix for networkId of 3', function () {
    assert.equal(etherscanNetworkPrefix(3), 'ropsten.')
  })

  it('returns rinkeby as prefix for networkId of 4', function () {
    assert.equal(etherscanNetworkPrefix(4), 'rinkeby.')
  })

  it('returs kovan as prefix for networkId of 42', function () {
    assert.equal(etherscanNetworkPrefix(42), 'kovan.')
  })

  it('returs goerli as prefix for networkId of 5', function () {
    assert.equal(etherscanNetworkPrefix(5), 'goerli.')
  })

})
