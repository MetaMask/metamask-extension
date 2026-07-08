import type { BridgeStatusControllerState } from '@metamask/bridge-status-controller';
import type { TransactionControllerState } from '@metamask/transaction-controller';
import {
  selectBridgeHistoryForApprovalTxId,
  selectBridgeHistoryForOriginalTxMetaId,
  selectBridgeHistoryForToast,
  selectNonEvmBridgeSourceTxIds,
} from './selectors';

type BridgeStatusAppState = {
  metamask: BridgeStatusControllerState & TransactionControllerState;
};

const EMPTY: never[] = [];

jest.mock('../../selectors/multichain-accounts/account-tree', () => ({
  getSelectedAccountGroup: () => undefined,
  getInternalAccountsFromGroupById: () => EMPTY,
}));

jest.mock('../../selectors/multichain-transactions', () => ({
  selectCurrentAccountNonEvmTransactions: () => EMPTY,
}));

describe('bridge-status selectors', () => {
  describe('selectBridgeHistoryForToast', () => {
    it('returns cross-chain items whose source tx exists in transactions', () => {
      const state = {
        metamask: {
          txHistory: {
            // cross-chain ✅ with matching source tx
            'tx-1': { quote: { srcChainId: 1, destChainId: 10 } },
            // same-chain with matching source tx
            'tx-2': { quote: { srcChainId: 1, destChainId: 1 } },
            // cross-chain with no matching source tx
            'tx-3': { quote: { srcChainId: 1, destChainId: 10 } },
          },
          transactions: [{ id: 'tx-1' }, { id: 'tx-2' }],
        },
      };

      const result = selectBridgeHistoryForToast(
        state as unknown as BridgeStatusAppState,
      );
      expect(Object.keys(result)).toStrictEqual(['tx-1']);
    });
  });

  describe('selectNonEvmBridgeSourceTxIds', () => {
    it('returns ids for cross-chain non-EVM source entries', () => {
      const solChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
      const state = {
        metamask: {
          txHistory: {
            // cross-chain, non-EVM source ✅
            'sol-tx': {
              quote: { srcChainId: solChainId, destChainId: 10 },
              originalTransactionId: 'orig-1',
            },
            // same-chain, EVM source
            'evm-tx': { quote: { srcChainId: 1, destChainId: 10 } },
            // same-chain, non-EVM source
            'same-chain': {
              quote: {
                srcChainId: solChainId,
                destChainId: solChainId,
              },
            },
          },
          transactions: [],
        },
      };

      const result = selectNonEvmBridgeSourceTxIds(
        state as unknown as BridgeStatusAppState,
      );
      expect(result).toStrictEqual(new Set(['sol-tx', 'orig-1']));
    });
  });

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

    it('returns the history item when the approval tx id is not a string', () => {
      const matchingBridgeHistoryItem = {
        approvalTxId: 42,
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          42 as any,
        ),
      ).toBe(matchingBridgeHistoryItem);
    });
  });
});
