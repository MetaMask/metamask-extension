import {
  MAINNET_CHAIN_ID,
  MAINNET_NETWORK_ID,
} from '../../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', () => {
  it('always shows the oldest tx first', () => {
    const metamaskNetworkId = MAINNET_NETWORK_ID;
    const chainId = MAINNET_CHAIN_ID;
    const txs = {
      a: { metamaskNetworkId, time: 3 },
      b: { metamaskNetworkId, time: 1 },
      c: { metamaskNetworkId, time: 2 },
    };

    const sorted = txHelper(txs, null, null, metamaskNetworkId, chainId);
    expect(sorted[0].time).toStrictEqual(1);
    expect(sorted[2].time).toStrictEqual(3);
  });
});
