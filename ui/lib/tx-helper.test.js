import { strict as assert } from 'assert';
import {
  MAINNET_CHAIN_ID,
  MAINNET_NETWORK_ID,
} from '../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', function () {
  it('always shows the oldest tx first', function () {
    const metamaskNetworkId = MAINNET_NETWORK_ID;
    const chainId = MAINNET_CHAIN_ID;
    const txs = {
      a: { metamaskNetworkId, time: 3 },
      b: { metamaskNetworkId, time: 1 },
      c: { metamaskNetworkId, time: 2 },
    };

    const sorted = txHelper(txs, null, null, metamaskNetworkId, chainId);
    assert.equal(sorted[0].time, 1, 'oldest tx first');
    assert.equal(sorted[2].time, 3, 'newest tx last');
  });
});
