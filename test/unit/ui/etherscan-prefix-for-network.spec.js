import assert from 'assert';
import {
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';
import { getEtherscanNetworkPrefix } from '../../../ui/lib/etherscan-prefix-for-network';

describe('Etherscan Network Prefix', function () {
  it('returns empty string as default value', function () {
    assert.equal(getEtherscanNetworkPrefix(), '');
  });

  it('returns empty string as a prefix for networkId of 1', function () {
    assert.equal(getEtherscanNetworkPrefix(MAINNET_CHAIN_ID), '');
  });

  it('returns ropsten as prefix for networkId of 3', function () {
    assert.equal(getEtherscanNetworkPrefix(ROPSTEN_CHAIN_ID), 'ropsten.');
  });

  it('returns rinkeby as prefix for networkId of 4', function () {
    assert.equal(getEtherscanNetworkPrefix(RINKEBY_CHAIN_ID), 'rinkeby.');
  });

  it('returs kovan as prefix for networkId of 42', function () {
    assert.equal(getEtherscanNetworkPrefix(KOVAN_CHAIN_ID), 'kovan.');
  });

  it('returs goerli as prefix for networkId of 5', function () {
    assert.equal(getEtherscanNetworkPrefix(GOERLI_CHAIN_ID), 'goerli.');
  });
});
