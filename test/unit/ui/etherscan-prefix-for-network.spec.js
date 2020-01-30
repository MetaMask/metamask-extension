const assert = require('assert')
const etherscanNetworkPrefix = require('../../../ui/lib/etherscan-prefix-for-network')

describe('Etherscan Network Prefix', () => {

  it('returns empy string as default value', () => {
    assert.equal(etherscanNetworkPrefix(), '')
  })

  it('returns empty string as a prefix for networkId of 1', () => {
    assert.equal(etherscanNetworkPrefix(1), '')
  })

  it('returns ropsten as prefix for networkId of 3', () => {
    assert.equal(etherscanNetworkPrefix(3), 'ropsten.')
  })

  it('returns rinkeby as prefix for networkId of 4', () => {
    assert.equal(etherscanNetworkPrefix(4), 'rinkeby.')
  })

  it('returs kovan as prefix for networkId of 42', () => {
    assert.equal(etherscanNetworkPrefix(42), 'kovan.')
  })

  it('returs goerli as prefix for networkId of 5', () => {
    assert.equal(etherscanNetworkPrefix(5), 'goerli.')
  })

})
