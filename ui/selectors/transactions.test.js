import { ApprovalType } from '@metamask/controller-utils';
import { TransactionStatus } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../shared/constants/network';
import {
  unapprovedMessagesSelector,
  transactionsSelector,
  nonceSortedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
  nonceSortedCompletedTransactionsSelector,
  submittedPendingTransactionsSelector,
  hasTransactionPendingApprovals,
} from './transactions';

describe('Transaction Selectors', () => {
  describe('unapprovedMessagesSelector', () => {
    it('returns eth sign msg from unapprovedMsgs', () => {
      const msg = {
        id: 1,
        msgParams: {
          from: '0xAddress',
          data: '0xData',
          origin: 'origin',
        },
        time: 1,
        status: TransactionStatus.unapproved,
        type: 'eth_sign',
      };

      const state = {
        metamask: {
          unapprovedMsgs: {
            1: msg,
          },
          providerConfig: {
            chainId: '0x5',
          },
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });

    it('returns personal sign from unapprovedPersonalMsgsSelector', () => {
      const msg = {
        id: 1,
        msgParams: {
          from: '0xAddress',
          data: '0xData',
          origin: 'origin',
        },
        time: 1,
        status: TransactionStatus.unapproved,
        type: 'personal_sign',
      };

      const state = {
        metamask: {
          unapprovedPersonalMsgs: {
            1: msg,
          },
          providerConfig: {
            chainId: '0x5',
          },
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });

    it('returns typed message from unapprovedTypedMessagesSelector', () => {
      const msg = {
        id: 1,
        msgParams: {
          data: '0xData',
          from: '0xAddress',
          version: 'V3',
          origin: 'origin',
        },
        time: 1,
        status: TransactionStatus.unapproved,
        type: 'eth_signTypedData',
      };

      const state = {
        metamask: {
          unapprovedTypedMessages: {
            1: msg,
          },
          providerConfig: {
            chainId: '0x5',
          },
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });
  });

  describe('transactionsSelector', () => {
    it('selects the current network transactions', () => {
      const state = {
        metamask: {
          providerConfig: {
            nickname: 'mainnet',
            chainId: CHAIN_IDS.MAINNET,
          },
          featureFlags: {},
          selectedAddress: '0xAddress',
          transactions: [
            {
              id: 0,
              chainId: CHAIN_IDS.MAINNET,
              time: 0,
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
            {
              id: 1,
              chainId: CHAIN_IDS.MAINNET,
              time: 1,
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
          ],
        },
      };

      const orderedTxList = state.metamask.transactions.sort(
        (a, b) => b.time - a.time,
      );

      const selectedTx = transactionsSelector(state);

      expect(Array.isArray(selectedTx)).toStrictEqual(true);
      expect(selectedTx).toStrictEqual(orderedTxList);
    });
    it('should not duplicate incoming transactions', () => {
      const state = {
        metamask: {
          providerConfig: {
            nickname: 'mainnet',
            chainId: CHAIN_IDS.MAINNET,
          },
          featureFlags: {},
          selectedAddress: '0xAddress',
          transactions: [
            {
              id: 0,
              chainId: CHAIN_IDS.MAINNET,
              time: 0,
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
            {
              id: 1,
              chainId: CHAIN_IDS.MAINNET,
              time: 1,
              txParams: {
                from: '0xAddress',
                to: '0xRecipient',
              },
            },
            {
              id: 2,
              chainId: CHAIN_IDS.MAINNET,
              time: 2,
              type: TransactionStatus.incoming,
              txParams: {
                from: '0xAddress',
                to: '0xAddress',
              },
            },
          ],
        },
      };

      const orderedTxList = state.metamask.transactions.sort(
        (a, b) => b.time - a.time,
      );

      const selectedTx = transactionsSelector(state);

      expect(Array.isArray(selectedTx)).toStrictEqual(true);
      expect(selectedTx).toStrictEqual(orderedTxList);
    });
  });

  describe('nonceSortedTransactionsSelector', () => {
    it('returns transaction group nonce sorted tx from from selectedTxList wit', () => {
      const tx1 = {
        id: 0,
        time: 0,
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
      };

      const tx2 = {
        id: 1,
        time: 1,
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x1',
        },
      };

      const state = {
        metamask: {
          providerConfig: {
            nickname: 'mainnet',
            chainId: CHAIN_IDS.MAINNET,
          },
          selectedAddress: '0xAddress',
          featureFlags: {},
          transactions: [tx1, tx2],
        },
      };

      const expectedResult = [
        {
          nonce: '0x0',
          transactions: [tx1],
          initialTransaction: tx1,
          primaryTransaction: tx1,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: '0x1',
          transactions: [tx2],
          initialTransaction: tx2,
          primaryTransaction: tx2,
          hasRetried: false,
          hasCancelled: false,
        },
      ];

      expect(nonceSortedTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });
  });

  describe('Sorting Transactions Selectors', () => {
    const submittedTx = {
      id: 0,
      time: 0,
      chainId: CHAIN_IDS.MAINNET,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x0',
      },
      status: TransactionStatus.submitted,
    };

    const unapprovedTx = {
      id: 1,
      time: 1,
      chainId: CHAIN_IDS.MAINNET,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x1',
      },
      status: TransactionStatus.unapproved,
    };

    const approvedTx = {
      id: 2,
      time: 2,
      chainId: CHAIN_IDS.MAINNET,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x2',
      },
      status: TransactionStatus.approved,
    };

    const confirmedTx = {
      id: 3,
      time: 3,
      chainId: CHAIN_IDS.MAINNET,
      txParams: {
        from: '0xAddress',
        to: '0xRecipient',
        nonce: '0x3',
      },
      status: TransactionStatus.confirmed,
    };

    const state = {
      metamask: {
        providerConfig: {
          nickname: 'mainnet',
          chainId: CHAIN_IDS.MAINNET,
        },
        selectedAddress: '0xAddress',
        featureFlags: {},
        transactions: [submittedTx, unapprovedTx, approvedTx, confirmedTx],
      },
    };

    it('nonceSortedPendingTransactionsSelector', () => {
      const expectedResult = [
        {
          nonce: submittedTx.txParams.nonce,
          transactions: [submittedTx],
          initialTransaction: submittedTx,
          primaryTransaction: submittedTx,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: unapprovedTx.txParams.nonce,
          transactions: [unapprovedTx],
          initialTransaction: unapprovedTx,
          primaryTransaction: unapprovedTx,
          hasRetried: false,
          hasCancelled: false,
        },
        {
          nonce: approvedTx.txParams.nonce,
          transactions: [approvedTx],
          initialTransaction: approvedTx,
          primaryTransaction: approvedTx,
          hasRetried: false,
          hasCancelled: false,
        },
      ];

      expect(nonceSortedPendingTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });

    it('nonceSortedCompletedTransactionsSelector', () => {
      const expectedResult = [
        {
          nonce: confirmedTx.txParams.nonce,
          transactions: [confirmedTx],
          initialTransaction: confirmedTx,
          primaryTransaction: confirmedTx,
          hasRetried: false,
          hasCancelled: false,
        },
      ];

      expect(nonceSortedCompletedTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });

    it('submittedPendingTransactionsSelector', () => {
      const expectedResult = [submittedTx];
      expect(submittedPendingTransactionsSelector(state)).toStrictEqual(
        expectedResult,
      );
    });
  });

  describe('hasTransactionPendingApprovals', () => {
    const mockChainId = 'mockChainId';
    const mockedState = {
      metamask: {
        providerConfig: {
          chainId: mockChainId,
        },
        pendingApprovalCount: 2,
        pendingApprovals: {
          1: {
            id: '1',
            origin: 'origin',
            time: Date.now(),
            type: ApprovalType.WatchAsset,
            requestData: {},
            requestState: null,
          },
          2: {
            id: '2',
            origin: 'origin',
            time: Date.now(),
            type: ApprovalType.Transaction,
            requestData: {},
            requestState: null,
          },
        },
        transactions: [
          {
            id: '2',
            chainId: mockChainId,
            status: TransactionStatus.unapproved,
          },
        ],
      },
    };

    it('should return true if there is a pending transaction on same network', () => {
      const result = hasTransactionPendingApprovals(mockedState);
      expect(result).toBe(true);
    });

    it('should return false if there is a pending transaction on different network', () => {
      mockedState.metamask.transactions[0].chainId = 'differentChainId';
      const result = hasTransactionPendingApprovals(mockedState);
      expect(result).toBe(false);
    });

    it.each([
      [ApprovalType.EthDecrypt],
      [ApprovalType.EthGetEncryptionPublicKey],
      [ApprovalType.EthSign],
      [ApprovalType.EthSignTypedData],
      [ApprovalType.PersonalSign],
    ])(
      'should return true if there is a pending transaction of %s type',
      (type) => {
        const result = hasTransactionPendingApprovals({
          ...mockedState,
          metamask: {
            ...mockedState.metamask,
            pendingApprovals: {
              2: {
                id: '2',
                origin: 'origin',
                time: Date.now(),
                type,
                requestData: {},
                requestState: null,
              },
            },
          },
        });
        expect(result).toBe(true);
      },
    );
  });
});
