import { CHAIN_IDS, NETWORK_IDS } from '../../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', () => {
  it('always shows the oldest tx first', () => {
    const networkID = NETWORK_IDS.MAINNET;
    const chainId = CHAIN_IDS.MAINNET;
    const mockUnapprovedTxs = {
      a: { networkID, time: 3 },
      b: { networkID, time: 6 },
      c: { networkID, time: 2 },
    };

    const mockUnapprovedMsgs = {
      d: { networkID, time: 4 },
      e: { networkID, time: 1 },
      f: { networkID, time: 5 },
    };

    const sorted = txHelper(
      mockUnapprovedTxs,
      mockUnapprovedMsgs,
      null,
      null,
      null,
      null,
      networkID,
      chainId,
    );

    expect(sorted[0].time).toStrictEqual(1);
    expect(sorted[2].time).toStrictEqual(3);
    expect(sorted[5].time).toStrictEqual(6);
  });
});
