import { TransactionType } from '@metamask/transaction-controller';
import {
  selectTransactionIds,
  selectBridgeApprovalTxIds,
  selectCrossChainBridgeSourceTxIds,
  selectEvmTransactionsForToast,
  selectNonEvmTransactionsForToast,
} from './toast';

type SelectorState = Parameters<typeof selectTransactionIds>[0];

describe('toast selectors', () => {
  describe('selectTransactionIds', () => {
    it('returns a Set of all transaction ids', () => {
      const state = {
        metamask: {
          transactions: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        },
      } as unknown as SelectorState;
      const result = selectTransactionIds(state);
      expect(result).toStrictEqual(new Set(['a', 'b', 'c']));
    });

    it('returns an empty Set when there are no transactions', () => {
      const result = selectTransactionIds({
        metamask: {},
      } as unknown as SelectorState);
      expect(result).toStrictEqual(new Set());
    });
  });

  describe('selectBridgeApprovalTxIds', () => {
    it('returns a Set of bridge approval tx ids (lowercased)', () => {
      const state = {
        metamask: {
          txHistory: {
            entry1: { approvalTxId: 'ABC' },
            entry2: { approvalTxId: 'def' },
            entry3: {},
          },
        },
      } as unknown as SelectorState;
      const result = selectBridgeApprovalTxIds(state);
      expect(result).toStrictEqual(new Set(['abc', 'def']));
    });

    it('returns an empty Set when there is no txHistory', () => {
      const result = selectBridgeApprovalTxIds({
        metamask: {},
      } as unknown as SelectorState);
      expect(result).toStrictEqual(new Set());
    });
  });

  describe('selectCrossChainBridgeSourceTxIds', () => {
    it('returns ids where srcChainId !== destChainId', () => {
      const state = {
        metamask: {
          txHistory: {
            crossChain: {
              quote: { srcChainId: 1, destChainId: 10 },
            },
            sameChain: {
              quote: { srcChainId: 1, destChainId: 1 },
            },
            noQuote: {},
          },
        },
      } as unknown as SelectorState;
      const result = selectCrossChainBridgeSourceTxIds(state);
      expect(result).toStrictEqual(new Set(['crossChain']));
    });
  });

  describe('selectEvmTransactionsForToast', () => {
    it('returns all transactions except excluded types', () => {
      const state = {
        metamask: {
          transactions: [
            { id: '0', time: 1, type: TransactionType.simpleSend },
            { id: '1', time: 2, type: TransactionType.deployContract },
            { id: '2', time: 3, type: TransactionType.swap },
            { id: '3', time: 4 },
            { id: '4', time: 5, type: TransactionType.swapApproval },
            { id: '5', time: 6, type: TransactionType.bridgeApproval },
            {
              id: '6',
              time: 7,
              type: TransactionType.shieldSubscriptionApprove,
            },
          ],
        },
      } as unknown as SelectorState;

      const results = selectEvmTransactionsForToast(state);

      expect(results).toStrictEqual([
        { id: '0', time: 1, type: TransactionType.simpleSend },
        { id: '1', time: 2, type: TransactionType.deployContract },
        { id: '2', time: 3, type: TransactionType.swap },
      ]);
    });

    it('deduplicates transactions by id', () => {
      const state = {
        metamask: {
          transactions: [
            { id: '0', time: 1, type: TransactionType.simpleSend },
            { id: '0', time: 2, type: TransactionType.simpleSend },
          ],
        },
      } as unknown as SelectorState;
      const results = selectEvmTransactionsForToast(state);
      expect(results).toHaveLength(1);
    });

    it('excludes bridge approval and cross-chain bridge source txs', () => {
      const state = {
        metamask: {
          transactions: [
            { id: 'approval-1', time: 1, type: TransactionType.simpleSend },
            { id: 'cross-chain-1', time: 2, type: TransactionType.simpleSend },
            { id: 'normal-1', time: 3, type: TransactionType.simpleSend },
          ],
          txHistory: {
            entry1: { approvalTxId: 'approval-1' },
            'cross-chain-1': {
              quote: { srcChainId: 1, destChainId: 10 },
            },
          },
        },
      } as unknown as SelectorState;
      const results = selectEvmTransactionsForToast(state);
      expect(results).toStrictEqual([
        { id: 'normal-1', time: 3, type: TransactionType.simpleSend },
      ]);
    });

    it('returns an empty array if there are no transactions', () => {
      const results = selectEvmTransactionsForToast(
        {} as unknown as SelectorState,
      );
      expect(results).toStrictEqual([]);
    });
  });

  describe('selectNonEvmTransactionsForToast', () => {
    it('returns all non-EVM transactions except excluded types', () => {
      const tx1 = {
        id: 'tx-1',
        type: 'send',
        status: 'submitted',
        chain: 'solana:mainnet',
      };
      const tx2 = {
        id: 'tx-2',
        type: 'swap',
        status: 'confirmed',
        chain: 'solana:mainnet',
      };
      const tx3 = {
        id: 'tx-3',
        type: 'send',
        status: 'failed',
        chain: 'solana:devnet',
      };
      const filteredOutType = {
        id: 'tx-4',
        type: 'approve',
        status: 'submitted',
        chain: 'solana:mainnet',
      };
      const includedBtcTx = {
        id: 'tx-5',
        type: 'send',
        status: 'submitted',
        chain: 'bip122:000000000019d6689c085ae165831e93',
      };

      const state = {
        metamask: {
          nonEvmTransactions: {
            'account-1': {
              'solana:mainnet': {
                transactions: [tx1, tx2, filteredOutType],
              },
            },
            'account-2': {
              'solana:mainnet': { transactions: [tx3] },
              'bip122:1': { transactions: [includedBtcTx] },
            },
          },
        },
      } as unknown as SelectorState;

      const results = selectNonEvmTransactionsForToast(state);

      expect(results).toStrictEqual([tx1, tx2, tx3, includedBtcTx]);
    });

    it('excludes cross-chain bridge source transactions', () => {
      const tx1 = { id: 'bridge-src', type: 'send' };
      const tx2 = { id: 'normal', type: 'send' };
      const state = {
        metamask: {
          nonEvmTransactions: {
            acct: { chain: { transactions: [tx1, tx2] } },
          },
          txHistory: {
            'bridge-src': { quote: { srcChainId: 1, destChainId: 10 } },
          },
        },
      } as unknown as SelectorState;
      const results = selectNonEvmTransactionsForToast(state);
      expect(results).toStrictEqual([tx2]);
    });

    it('returns an empty array if non-EVM transactions do not exist', () => {
      const results = selectNonEvmTransactionsForToast(
        {} as unknown as SelectorState,
      );
      expect(results).toStrictEqual([]);
    });
  });
});
