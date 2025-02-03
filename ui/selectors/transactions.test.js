import { ApprovalType } from '@metamask/controller-utils';
import { EthAccountType } from '@metamask/keyring-api';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  SmartTransactionStatuses,
  SmartTransactionMinedTx,
} from '@metamask/smart-transactions-controller/dist/types';
import { CHAIN_IDS } from '../../shared/constants/network';
import {
  ETH_4337_METHODS,
  ETH_EOA_METHODS,
} from '../../shared/constants/eth-methods';
import { mockNetworkState } from '../../test/stub/networks';
import {
  unapprovedMessagesSelector,
  transactionsSelector,
  nonceSortedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
  nonceSortedCompletedTransactionsSelector,
  submittedPendingTransactionsSelector,
  hasTransactionPendingApprovals,
  getApprovedAndSignedTransactions,
  smartTransactionsListSelector,
  getTransactions,
} from './transactions';

describe('Transaction Selectors', () => {
  describe('unapprovedMessagesSelector', () => {
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
          ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
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
          ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
        },
      };

      const msgSelector = unapprovedMessagesSelector(state);

      expect(Array.isArray(msgSelector)).toStrictEqual(true);
      expect(msgSelector).toStrictEqual([msg]);
    });
  });
  describe('smartTransactionsListSelector', () => {
    const createSmartTransaction = (customParams = {}) => {
      return {
        uuid: 'uuid1',
        status: customParams.status || SmartTransactionStatuses.SUCCESS,
        type: customParams.type || TransactionType.contractInteraction,
        cancellable: false,
        confirmed: customParams.confirmed ?? false,
        statusMetadata: {
          cancellationFeeWei: 36777567771000,
          cancellationReason:
            customParams.cancellationReason || 'not_cancelled',
          deadlineRatio: 0.6400288486480713,
          minedHash: customParams.minedHash || '',
          minedTx: customParams.minedTx || '',
        },
        txParams: {
          from: customParams.fromAddress || '0xAddress',
          to: '0xRecipient',
        },
      };
    };

    const createState = (smartTransaction) => {
      return {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          featureFlags: {},
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                address: '0xAddress',
              },
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
          smartTransactionsState: {
            liveness: true,
            fees: null,
            smartTransactions: {
              [CHAIN_IDS.MAINNET]: smartTransaction ? [smartTransaction] : [],
            },
          },
        },
      };
    };

    it('returns an empty array if there are no smart transactions in state', () => {
      const state = createState();
      state.metamask.smartTransactionsState.smartTransactions = {
        [CHAIN_IDS.MAINNET]: [],
      };

      const result = smartTransactionsListSelector(state);

      expect(result).toStrictEqual([]);
    });

    it('does not return a confirmed transaction with status "success"', () => {
      const smartTransaction = createSmartTransaction({
        minedHash:
          '0x55ad39634ee10d417b6e190cfd3736098957e958879cffe78f1f00f4fd2654d6',
        minedTx: SmartTransactionMinedTx.SUCCESS,
        confirmed: true,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });

    it('does not return a confirmed transaction with status "reverted"', () => {
      const smartTransaction = createSmartTransaction({
        minedTx: SmartTransactionMinedTx.REVERTED,
        confirmed: true,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });

    it('does not return a confirmed transaction', () => {
      const smartTransaction = createSmartTransaction({
        confirmed: true,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });

    it('does not return an unconfirmed transaction with status "pending" for a different from address', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.PENDING,
        fromAddress: '0xAddress2',
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });

    it('returns an unconfirmed transaction with status "pending"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.PENDING,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [
        {
          ...smartTransaction,
          isSmartTransaction: true,
        },
      ];
      expect(result).toStrictEqual(expected);
    });

    it('returns an unconfirmed transaction with status "cancelled" and type "swap"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.PENDING,
        type: TransactionType.swap,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [
        {
          ...smartTransaction,
          isSmartTransaction: true,
        },
      ];
      expect(result).toStrictEqual(expected);
    });

    it('returns an unconfirmed transaction with status "cancelled" and type "swapApproval"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.PENDING,
        type: TransactionType.swapApproval,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [
        {
          ...smartTransaction,
          isSmartTransaction: true,
        },
      ];
      expect(result).toStrictEqual(expected);
    });

    it('returns an unconfirmed transaction with status "unknown" and type "swap"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.UNKNOWN,
        type: TransactionType.swap,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [
        {
          ...smartTransaction,
          isSmartTransaction: true,
        },
      ];
      expect(result).toStrictEqual(expected);
    });

    it('returns an unconfirmed transaction with status "resolved" and type "swap"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.RESOLVED,
        type: TransactionType.swap,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [
        {
          ...smartTransaction,
          isSmartTransaction: true,
        },
      ];
      expect(result).toStrictEqual(expected);
    });

    it('does not return an unconfirmed transaction with status "cancelled" and type "simpleSend"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.CANCELLED,
        type: TransactionType.simpleSend,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });

    it('does not return an unconfirmed transaction with status "unknown" and type "simpleSend"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.UNKNOWN,
        type: TransactionType.simpleSend,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });

    it('does not return an unconfirmed transaction with status "reverted" and type "simpleSend"', () => {
      const smartTransaction = createSmartTransaction({
        status: SmartTransactionStatuses.REVERTED,
        type: TransactionType.simpleSend,
      });
      const state = createState(smartTransaction);

      const result = smartTransactionsListSelector(state);

      const expected = [];
      expect(result).toStrictEqual(expected);
    });
  });

  describe('transactionsSelector', () => {
    it('selects the current network transactions', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          featureFlags: {},
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                address: '0xAddress',
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
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

      const selectedTx = transactionsSelector(state);

      expect(Array.isArray(selectedTx)).toStrictEqual(true);
      expect(selectedTx).toStrictEqual([
        state.metamask.transactions[1],
        state.metamask.transactions[0],
      ]);
    });
    it('should not duplicate incoming transactions', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          featureFlags: {},
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                address: '0xAddress',
              },
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
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
              type: TransactionType.incoming,
              txParams: {
                from: '0xAddress',
                to: '0xAddress',
              },
            },
          ],
        },
      };

      const selectedTx = transactionsSelector(state);

      expect(Array.isArray(selectedTx)).toStrictEqual(true);
      expect(selectedTx).toStrictEqual([
        state.metamask.transactions[1],
        state.metamask.transactions[0],
      ]);
    });
  });

  describe('nonceSortedTransactionsSelector', () => {
    it('returns transaction group nonce sorted tx from selectedTxList', () => {
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
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                address: '0xAddress',
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
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
        ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0xAddress',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_4337_METHODS,
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
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
        ...mockNetworkState({ chainId: mockChainId }),
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

    it('should return true if there is a pending transaction on different network', () => {
      mockedState.metamask.transactions[0].chainId = 'differentChainId';
      const result = hasTransactionPendingApprovals(mockedState);
      expect(result).toBe(true);
    });

    it.each([
      [ApprovalType.EthDecrypt],
      [ApprovalType.EthGetEncryptionPublicKey],
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

  describe('getApprovedAndSignedTransactions', () => {
    it('returns transactions with status of approved or signed for all networks', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          transactions: [
            {
              id: 0,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.approved,
            },
            {
              id: 1,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.submitted,
            },
            {
              id: 2,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.unapproved,
            },
            {
              id: 3,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.signed,
            },
            {
              id: 4,
              chainId: CHAIN_IDS.GOERLI,
              status: TransactionStatus.signed,
            },
          ],
        },
      };

      const results = getApprovedAndSignedTransactions(state);

      expect(results).toStrictEqual([
        state.metamask.transactions[0],
        state.metamask.transactions[3],
        state.metamask.transactions[4],
      ]);
    });

    it('returns an empty array if there are no approved or signed transactions', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          transactions: [
            {
              id: 0,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.submitted,
            },
            {
              id: 1,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.unapproved,
            },
          ],
        },
      };

      const results = getApprovedAndSignedTransactions(state);

      expect(results).toStrictEqual([]);
    });
  });

  describe('getTransactions', () => {
    it('returns all transactions for all networks', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          transactions: [
            {
              id: 0,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.approved,
            },
            {
              id: 1,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.submitted,
            },
            {
              id: 2,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.unapproved,
            },
            {
              id: 3,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.signed,
            },
            {
              id: 4,
              chainId: CHAIN_IDS.GOERLI,
              status: TransactionStatus.signed,
            },
          ],
        },
      };

      const results = getTransactions(state);

      expect(results).toStrictEqual(state.metamask.transactions);
    });

    it('returns an empty array if there are no transactions', () => {
      const results = getTransactions({});
      expect(results).toStrictEqual([]);
    });
  });
});
