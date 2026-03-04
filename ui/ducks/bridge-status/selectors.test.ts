import {
  selectBridgeHistoryForApprovalTxId,
  selectBridgeHistoryForOriginalTxMetaId,
} from './selectors';

describe('bridge-status selectors', () => {
  describe('selectBridgeHistoryForOriginalTxMetaId', () => {
    it('returns the history item that matches the original transaction id', () => {
      const matchingBridgeHistoryItem = {
        originalTransactionId: 'tx-meta-id',
        status: { srcChain: 'PENDING' },
      };
      const state = {
        metamask: {
          txHistory: {
            orderUid: matchingBridgeHistoryItem,
          },
        },
      };

      expect(
        selectBridgeHistoryForOriginalTxMetaId(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          state as any,
          'tx-meta-id',
        ),
      ).toBe(matchingBridgeHistoryItem);
    });

    it('returns undefined when there is no match', () => {
      const state = {
        metamask: {
          txHistory: {
            orderUid: {
              originalTransactionId: 'different-tx',
            },
          },
        },
      };

      expect(
        selectBridgeHistoryForOriginalTxMetaId(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          state as any,
          'tx-meta-id',
        ),
      ).toBeUndefined();
    });
  });

  describe('selectBridgeHistoryForApprovalTxId', () => {
    it('returns the history item when the approval tx id casing differs', () => {
      const matchingBridgeHistoryItem = {
        approvalTxId: '0xAbC123',
        status: { srcChain: 'PENDING' },
      };
      const state = {
        metamask: {
          txHistory: {
            orderUid: matchingBridgeHistoryItem,
          },
        },
      };

      expect(
        selectBridgeHistoryForApprovalTxId(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          state as any,
          '0xabc123',
        ),
      ).toBe(matchingBridgeHistoryItem);
    });
  });
});
