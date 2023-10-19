import { CHAIN_IDS } from '../../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', () => {
  it('always shows the oldest tx first', () => {
    const chainId = CHAIN_IDS.MAINNET;
    const mockUnapprovedTxs = {
      a: { chainId, time: 3 },
      b: { chainId, time: 6 },
      c: { chainId, time: 2 },
    };

    const mockUnapprovedMsgs = {
      d: { chainId, time: 4 },
      e: { chainId, time: 1 },
      f: { chainId, time: 5 },
    };

    const sorted = txHelper(
      mockUnapprovedTxs,
      mockUnapprovedMsgs,
      null,
      null,
      null,
      null,
      chainId,
    );

    expect(sorted[0].time).toStrictEqual(1);
    expect(sorted[2].time).toStrictEqual(3);
    expect(sorted[5].time).toStrictEqual(6);
  });
});
