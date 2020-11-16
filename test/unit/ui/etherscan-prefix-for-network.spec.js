import assert from 'assert'
import { getEtherscanNetworkPrefix } from '../../../ui/lib/etherscan-prefix-for-network'

describe('Etherscan Network Prefix', function () {
  it('returns empty string as default value', function () {
    assert.equal(getEtherscanNetworkPrefix(), '')
  })

  it('returns empty string as a prefix for networkId of 1', function () {
    assert.equal(getEtherscanNetworkPrefix('1'), '')
  })

  it('returns ropsten as prefix for networkId of 3', function () {
    assert.equal(getEtherscanNetworkPrefix('3'), 'ropsten.')
  })

  it('returns rinkeby as prefix for networkId of 4', function () {
    assert.equal(getEtherscanNetworkPrefix('4'), 'rinkeby.')
  })

  it('returs kovan as prefix for networkId of 42', function () {
    assert.equal(getEtherscanNetworkPrefix('42'), 'kovan.')
  })

  it('returs goerli as prefix for networkId of 5', function () {
    assert.equal(getEtherscanNetworkPrefix('5'), 'goerli.')
  })
})
