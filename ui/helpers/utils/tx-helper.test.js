import { CHAIN_IDS, NETWORK_IDS } from '../../../shared/constants/network';
import txHelper from './tx-helper';

describe('txHelper', () => {
  it('always shows the oldest tx first', () => {
    const metamaskNetworkId = NETWORK_IDS.MAINNET;
    const chainId = CHAIN_IDS.MAINNET;
    const mockUnapprovedTxs = {
      a: { metamaskNetworkId, time: 3 },
      b: { metamaskNetworkId, time: 6 },
      c: { metamaskNetworkId, time: 2 },
    };

    const mockUnapprovedMsgs = {
      d: { metamaskNetworkId, time: 4 },
      e: { metamaskNetworkId, time: 1 },
      f: { metamaskNetworkId, time: 5 },
    };

    const sorted = txHelper(
      mockUnapprovedTxs,
      mockUnapprovedMsgs,
      null,
      null,
      null,
      null,
      metamaskNetworkId,
      chainId,
    );

    expect(sorted[0].time).toStrictEqual(1);
    expect(sorted[2].time).toStrictEqual(3);
    expect(sorted[5].time).toStrictEqual(6);
  });
});
