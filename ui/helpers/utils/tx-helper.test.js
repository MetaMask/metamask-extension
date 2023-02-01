import { CHAIN_IDS } from '../../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', () => {
  it('always shows the oldest tx first', () => {
    const chainId = CHAIN_IDS.MAINNET;
    const txs = {
      a: { chainId, time: 3 },
      b: { chainId, time: 1 },
      c: { chainId, time: 2 },
    };

    const sorted = txHelper(txs, null, null, null, null, null, chainId);
    expect(sorted[0].time).toStrictEqual(1);
    expect(sorted[2].time).toStrictEqual(3);
  });
});
