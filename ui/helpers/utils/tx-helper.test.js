import { CHAIN_IDS, NETWORK_IDS } from '../../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', () => {
  it('always shows the oldest tx first', () => {
    const metamaskNetworkId = NETWORK_IDS.MAINNET;
    const chainId = CHAIN_IDS.MAINNET;
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
