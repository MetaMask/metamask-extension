import {
  TransactionType,
  TransactionStatus,
  TransactionController,
} from '@metamask/transaction-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  SmartTransactionsController,
  SmartTransactionsControllerMessenger,
  ClientId,
  type SmartTransaction,
} from '@metamask/smart-transactions-controller';
import type {
  TransactionControllerConfirmExternalTransactionAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetTransactionsAction,
  TransactionControllerUpdateTransactionAction,
} from '@metamask/transaction-controller';
import { NetworkControllerStateChangeEvent } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  submitSmartTransactionHook,
  submitBatchSmartTransactionHook,
} from './smart-transactions';
import type {
  SubmitSmartTransactionRequest,
  AllowedActions,
  AllowedEvents,
} from './smart-transactions';

const addressFrom = '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e';
const txHash =
  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356';
const uuid = 'uuid';
const txId = '1';

let addRequestCallback: () => void;

const createSignedTransaction = () => {
  return '0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a02b79f322a625d623a2bb2911e0c6b3e7eaf741a7c7c5d2e8c67ef3ff4acf146ca01ae168fea63dc3391b75b586c8a7c0cb55cdf3b8e2e4d8e097957a3a56c6f2c5';
};

const createTransactionControllerMock = () => {
  return {
    approveTransactionsWithSameNonce: jest.fn((transactions = []) => {
      return transactions.length === 0 ? [] : [createSignedTransaction()];
    }),
    state: { transactions: [] },
  } as unknown as jest.Mocked<TransactionController>;
};

type WithRequestOptions = {
  options?: Partial<SubmitSmartTransactionRequest>;
};

type WithRequestCallback<ReturnValue> = ({
  request,
  messenger,
  startFlowSpy,
  addRequestSpy,
  updateRequestStateSpy,
  endFlowSpy,
}: {
  request: SubmitSmartTransactionRequest;
  messenger: SmartTransactionsControllerMessenger;
  startFlowSpy: jest.Mock;
  addRequestSpy: jest.Mock;
  updateRequestStateSpy: jest.Mock;
  endFlowSpy: jest.Mock;
}) => ReturnValue;

type WithRequestArgs<ReturnValue> =
  | [WithRequestCallback<ReturnValue>]
  | [WithRequestOptions, WithRequestCallback<ReturnValue>];

function withRequest<ReturnValue>(
  ...args: WithRequestArgs<ReturnValue>
): ReturnValue {
  const [{ ...rest }, fn] = args.length === 2 ? args : [{}, args[0]];
  const { options } = rest;
  const messenger = new Messenger<
    MockAnyNamespace,
    | MessengerActions<SmartTransactionsControllerMessenger>
    | TransactionControllerGetNonceLockAction
    | TransactionControllerConfirmExternalTransactionAction
    | TransactionControllerGetTransactionsAction
    | TransactionControllerUpdateTransactionAction
    | AllowedActions,
    | MessengerEvents<SmartTransactionsControllerMessenger>
    | NetworkControllerStateChangeEvent
    | AllowedEvents
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const startFlowSpy = jest.fn().mockResolvedValue({ id: 'approvalId' });
  messenger.registerActionHandler('ApprovalController:startFlow', startFlowSpy);

  const addRequestSpy = jest.fn().mockImplementation(() => {
    return Promise.resolve().then(() => {
      if (typeof addRequestCallback === 'function') {
        addRequestCallback();
      }
    });
  });
  messenger.registerActionHandler(
    'ApprovalController:addRequest',
    addRequestSpy,
  );

  const updateRequestStateSpy = jest.fn();
  messenger.registerActionHandler(
    'ApprovalController:updateRequestState',
    updateRequestStateSpy,
  );

  const endFlowSpy = jest.fn();
  messenger.registerActionHandler('ApprovalController:endFlow', endFlowSpy);

  const smartTransactionsControllerMessenger = new Messenger<
    'SmartTransactionsController',
    MessengerActions<SmartTransactionsControllerMessenger>,
    MessengerEvents<SmartTransactionsControllerMessenger>,
    typeof messenger
  >({
    namespace: 'SmartTransactionsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: smartTransactionsControllerMessenger,
    actions: [
      'TransactionController:getNonceLock',
      'TransactionController:getTransactions',
      'TransactionController:updateTransaction',
    ],
    events: ['NetworkController:stateChange'],
  });

  const smartTransactionsController = new SmartTransactionsController({
    messenger: smartTransactionsControllerMessenger,
    trackMetaMetricsEvent: jest.fn(),
    getMetaMetricsProps: jest.fn(),
    clientId: ClientId.Extension,
    getFeatureFlags: jest.fn(),
  });

  jest.spyOn(smartTransactionsController, 'getFees').mockResolvedValue({
    tradeTxFees: {
      cancelFees: [],
      feeEstimate: 42000000000000,
      fees: [{ maxFeePerGas: 12843636951, maxPriorityFeePerGas: 2853145236 }],
      gasLimit: 21000,
      gasUsed: 21000,
    },
    approvalTxFees: null,
  });
  jest
    .spyOn(smartTransactionsController, 'submitSignedTransactions')
    .mockResolvedValue({
      uuid,
      txHash,
    });

  const request: SubmitSmartTransactionRequest = {
    transactionMeta: {
      hash: txHash,
      status: TransactionStatus.signed,
      id: '1',
      txParams: {
        from: addressFrom,
        to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        maxFeePerGas: '0x2fd8a58d7',
        maxPriorityFeePerGas: '0xaa0f8a94',
        gas: '0x7b0d',
        nonce: '0x4b',
      },
      type: TransactionType.simpleSend,
      chainId: CHAIN_IDS.MAINNET,
      networkClientId: 'testNetworkClientId',
      time: 1624408066355,
      defaultGasEstimates: {
        gas: '0x7b0d',
        gasPrice: '0x77359400',
      },
      securityProviderResponse: {
        flagAsDangerous: 0,
      },
    },
    smartTransactionsController,
    transactionController: createTransactionControllerMock(),
    isSmartTransaction: true,
    signedTransactionInHex:
      '0x02f8b104058504a817c8008504a817c80082b427949ba60bbf4ba1de43f3b4983a539feebfbd5fd97680b844095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170c080a0fdd2cb46203b5e7bba99cc56a37da3e5e3f36163a5bd9c51cddfd8d7028f5dd0a054c35cfa10b3350a3fd3a0e7b4aeb0b603d528c07a8cfdf4a78505d9864edef4',
    controllerMessenger: messenger,
    featureFlags: {
      extensionActive: true,
      mobileActive: false,
      smartTransactions: {
        expectedDeadline: 45,
        maxDeadline: 150,
        extensionReturnTxHashAsap: false,
        extensionReturnTxHashAsapBatch: false,
      },
    },
    ...options,
  };

  return fn({
    request,
    messenger: smartTransactionsControllerMessenger,
    startFlowSpy,
    addRequestSpy,
    updateRequestStateSpy,
    endFlowSpy,
  });
}

describe('submitSmartTransactionHook', () => {
  beforeEach(() => {
    addRequestCallback = () => undefined;
  });

  it('does not submit a transaction that is not a smart transaction', async () => {
    withRequest(
      {
        options: {
          isSmartTransaction: false,
        },
      },
      async ({ request }) => {
        const result = await submitSmartTransactionHook(request);
        expect(result).toEqual({ transactionHash: undefined });
      },
    );
  });

  it('falls back to regular transaction submit if the transaction type is "swapAndSend"', async () => {
    withRequest(async ({ request }) => {
      if (request.transactionMeta) {
        request.transactionMeta.type = TransactionType.swapAndSend;
      }
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('falls back to regular transaction submit if the transaction type is "swapApproval"', async () => {
    withRequest(async ({ request }) => {
      if (request.transactionMeta) {
        request.transactionMeta.type = TransactionType.swapApproval;
      }
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('falls back to regular transaction submit if it is a legacy transaction', async () => {
    withRequest(async ({ request }) => {
      // Modify transaction to be a legacy transaction (has gasPrice, no maxFeePerGas/maxPriorityFeePerGas)
      request.transactionMeta.txParams = {
        ...request.transactionMeta.txParams,
        gasPrice: '0x77359400',
      };
      // Remove EIP-1559 specific fields if they exist
      delete request.transactionMeta.txParams.maxFeePerGas;
      delete request.transactionMeta.txParams.maxPriorityFeePerGas;

      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('falls back to regular transaction submit if /getFees throws an error', async () => {
    withRequest(async ({ request, endFlowSpy }) => {
      jest
        .spyOn(request.smartTransactionsController, 'getFees')
        .mockImplementation(() => {
          throw new Error('Backend call to /getFees failed');
        });
      const result = await submitSmartTransactionHook(request);
      expect(request.smartTransactionsController.getFees).toHaveBeenCalled();
      expect(endFlowSpy).toHaveBeenCalledWith({
        id: 'approvalId',
      });
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('skips getting fees if the transaction is signed and sponsored', async () => {
    withRequest(async ({ request }) => {
      request.transactionMeta.isGasFeeSponsored = true;
      request.featureFlags.smartTransactions.extensionReturnTxHashAsap = true;

      const result = await submitSmartTransactionHook(request);

      expect(
        request.smartTransactionsController.getFees,
      ).not.toHaveBeenCalled();
      expect(
        request.smartTransactionsController.submitSignedTransactions,
      ).toHaveBeenCalled();
      expect(result).toEqual({ transactionHash: txHash });
    });
  });

  it('returns a txHash asap if the feature flag requires it', async () => {
    withRequest(async ({ request }) => {
      request.featureFlags.smartTransactions.extensionReturnTxHashAsap = true;
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: txHash });
    });
  });

  it('throws an error if there is no uuid', async () => {
    withRequest(async ({ request }) => {
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          return { uuid: undefined };
        },
      );
      await expect(submitSmartTransactionHook(request)).rejects.toThrow(
        'No smart transaction UUID',
      );
    });
  });

  it('throws an error if there is no transaction hash', async () => {
    withRequest(async ({ request, messenger }) => {
      setImmediate(() => {
        messenger.publish('SmartTransactionsController:smartTransaction', {
          status: 'cancelled',
          uuid,
          statusMetadata: {
            minedHash: '',
          },
        } as SmartTransaction);
      });
      await expect(submitSmartTransactionHook(request)).rejects.toThrow(
        'Transaction does not have a transaction hash, there was a problem',
      );
    });
  });

  it('submits a smart transaction with an already signed transaction', async () => {
    withRequest(
      async ({
        request,
        messenger,
        startFlowSpy,
        addRequestSpy,
        updateRequestStateSpy,
        endFlowSpy,
      }) => {
        setImmediate(() => {
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'pending',
            uuid,
            statusMetadata: {
              minedHash: '',
            },
          } as SmartTransaction);
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'success',
            uuid,
            statusMetadata: {
              minedHash: txHash,
            },
          } as SmartTransaction);
        });
        const result = await submitSmartTransactionHook(request);
        expect(result).toEqual({ transactionHash: txHash });
        const { txParams } = request.transactionMeta || {};
        expect(
          request.smartTransactionsController.submitSignedTransactions,
        ).toHaveBeenCalledWith({
          signedTransactions: [request.signedTransactionInHex],
          signedCanceledTransactions: [],
          txParams,
          transactionMeta: request.transactionMeta,
        });
        addRequestCallback();
        expect(startFlowSpy).toHaveBeenCalled();
        expect(addRequestSpy).toHaveBeenCalledWith(
          {
            id: 'approvalId',
            origin: 'http://localhost',
            type: 'smartTransaction:showSmartTransactionStatusPage',
            requestState: {
              smartTransaction: {
                status: 'pending',
                uuid,
                creationTime: expect.any(Number),
              },
              isDapp: true,
              txId,
            },
          },
          true,
        );
        expect(updateRequestStateSpy).toHaveBeenCalledWith({
          id: 'approvalId',
          requestState: {
            smartTransaction: {
              uuid,
              status: 'success',
              statusMetadata: {
                minedHash:
                  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356',
              },
            },
            isDapp: true,
            txId,
          },
        });

        expect(endFlowSpy).toHaveBeenCalledWith({
          id: 'approvalId',
        });
      },
    );
  });

  it('signs and submits a smart transaction', async () => {
    withRequest(
      {
        options: {
          signedTransactionInHex: undefined,
        },
      },
      async ({
        request,
        messenger,
        startFlowSpy,
        addRequestSpy,
        updateRequestStateSpy,
        endFlowSpy,
      }) => {
        setImmediate(() => {
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'pending',
            uuid,
            statusMetadata: {
              minedHash: '',
            },
          } as SmartTransaction);
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'success',
            uuid,
            statusMetadata: {
              minedHash: txHash,
            },
          } as SmartTransaction);
        });
        const result = await submitSmartTransactionHook(request);
        expect(result).toEqual({ transactionHash: txHash });
        const { txParams, chainId } = request.transactionMeta || {};
        expect(
          request.transactionController.approveTransactionsWithSameNonce,
        ).toHaveBeenCalledWith(
          [
            {
              ...txParams,
              maxFeePerGas: '0x2fd8a58d7',
              maxPriorityFeePerGas: '0xaa0f8a94',
              chainId,
            },
          ],
          { hasNonce: true },
        );
        expect(
          request.smartTransactionsController.submitSignedTransactions,
        ).toHaveBeenCalledWith({
          signedTransactions: [createSignedTransaction()],
          signedCanceledTransactions: [],
          txParams,
          transactionMeta: request.transactionMeta,
        });
        addRequestCallback();
        expect(startFlowSpy).toHaveBeenCalled();
        expect(addRequestSpy).toHaveBeenCalledWith(
          {
            id: 'approvalId',
            origin: 'http://localhost',
            type: 'smartTransaction:showSmartTransactionStatusPage',
            requestState: {
              smartTransaction: {
                status: 'pending',
                uuid,
                creationTime: expect.any(Number),
              },
              isDapp: true,
              txId,
            },
          },
          true,
        );
        expect(updateRequestStateSpy).toHaveBeenCalledWith({
          id: 'approvalId',
          requestState: {
            smartTransaction: {
              uuid,
              status: 'success',
              statusMetadata: {
                minedHash:
                  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356',
              },
            },
            isDapp: true,
            txId,
          },
        });

        expect(endFlowSpy).toHaveBeenCalledWith({
          id: 'approvalId',
        });
      },
    );
  });

  it('submits a smart transaction and does not update approval request if approval was already approved or rejected', async () => {
    withRequest(
      async ({
        request,
        messenger,
        startFlowSpy,
        addRequestSpy,
        updateRequestStateSpy,
        endFlowSpy,
      }) => {
        setImmediate(() => {
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'pending',
            uuid,
            statusMetadata: {
              minedHash: '',
            },
          } as SmartTransaction);
          addRequestCallback();
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'success',
            uuid,
            statusMetadata: {
              minedHash: txHash,
            },
          } as SmartTransaction);
        });
        const result = await submitSmartTransactionHook(request);
        expect(result).toEqual({ transactionHash: txHash });
        const { txParams } = request.transactionMeta || {};
        expect(
          request.transactionController.approveTransactionsWithSameNonce,
        ).not.toHaveBeenCalled();
        expect(
          request.smartTransactionsController.submitSignedTransactions,
        ).toHaveBeenCalledWith({
          signedTransactions: [request.signedTransactionInHex],
          signedCanceledTransactions: [],
          txParams,
          transactionMeta: request.transactionMeta,
        });
        expect(startFlowSpy).toHaveBeenCalled();
        expect(addRequestSpy).toHaveBeenCalledWith(
          {
            id: 'approvalId',
            origin: 'http://localhost',
            type: 'smartTransaction:showSmartTransactionStatusPage',
            requestState: {
              smartTransaction: {
                status: 'pending',
                uuid,
                creationTime: expect.any(Number),
              },
              isDapp: true,
              txId,
            },
          },
          true,
        );
        expect(updateRequestStateSpy).not.toHaveBeenCalled();
        expect(endFlowSpy).toHaveBeenCalledWith({
          id: 'approvalId',
        });
      },
    );
  });

  it('ends existing approval flow when starting a new one', async () => {
    // First submission to set up existing approval flow
    const firstApprovalId = 'firstApprovalId';
    const secondApprovalId = 'secondApprovalId';
    let currentApprovalFlowId = firstApprovalId;

    const customStartFlowSpy = jest.fn().mockImplementation(() => {
      return { id: currentApprovalFlowId };
    });

    const endFlowSpy = jest.fn();
    const acceptRequestSpy = jest.fn();
    const addRequestSpy = jest.fn(() => Promise.resolve());

    // Create a mock messenger
    const mockMessenger = {
      call: jest.fn().mockImplementation((method, ...args) => {
        if (method === 'ApprovalController:startFlow') {
          return customStartFlowSpy();
        }
        if (method === 'ApprovalController:endFlow') {
          return endFlowSpy(...args);
        }
        if (method === 'ApprovalController:acceptRequest') {
          return acceptRequestSpy(...args);
        }
        if (method === 'ApprovalController:addRequest') {
          return addRequestSpy();
        }
        return undefined;
      }),
      subscribe: jest.fn(),
      registerActionHandler: jest.fn(),
      publish: jest.fn(),
    };

    // Type assertion using SubmitSmartTransactionRequest parameter type
    const typedMessenger =
      mockMessenger as unknown as SubmitSmartTransactionRequest['controllerMessenger'];

    withRequest(
      {
        options: {
          controllerMessenger: typedMessenger,
        },
      },
      async ({ request }) => {
        // Mock the transaction success for both submissions
        // We do this outside the messenger to avoid type issues
        setImmediate(() => {
          request.smartTransactionsController.submitSignedTransactions = jest
            .fn()
            .mockReturnValue({
              uuid,
              txHash,
            });
        });

        // First submission - creates a flow
        await submitSmartTransactionHook(request);

        // Verify first flow created
        expect(customStartFlowSpy).toHaveBeenCalledTimes(1);

        // Change approval flow ID for second transaction
        currentApprovalFlowId = secondApprovalId;

        // Second submission - should end the first flow and start a new one
        await submitSmartTransactionHook(request);

        // Verify endFlow and acceptRequest were called for the first flow
        expect(endFlowSpy).toHaveBeenCalledWith({
          id: firstApprovalId,
        });
        expect(acceptRequestSpy).toHaveBeenCalledWith(firstApprovalId);

        // Verify startFlow was called again for the second transaction
        expect(customStartFlowSpy).toHaveBeenCalledTimes(2);
      },
    );
  });

  describe('shouldShowStatusPage logic', () => {
    it('does not show status page for bridge transaction type', async () => {
      withRequest(
        {
          options: {
            transactionMeta: {
              hash: txHash,
              status: TransactionStatus.signed,
              id: '1',
              txParams: {
                from: addressFrom,
                to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
                maxFeePerGas: '0x2fd8a58d7',
                maxPriorityFeePerGas: '0xaa0f8a94',
                gas: '0x7b0d',
                nonce: '0x4b',
              },
              type: TransactionType.bridge,
              chainId: CHAIN_IDS.MAINNET,
              networkClientId: 'testNetworkClientId',
              time: 1624408066355,
              defaultGasEstimates: {
                gas: '0x7b0d',
                gasPrice: '0x77359400',
              },
              securityProviderResponse: {
                flagAsDangerous: 0,
              },
            },
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          await submitSmartTransactionHook(request);

          // Status page should not be shown for bridge transactions
          expect(startFlowSpy).not.toHaveBeenCalled();
          expect(addRequestSpy).not.toHaveBeenCalled();
        },
      );
    });

    it('does not show status page for shieldSubscriptionApprove transaction type', async () => {
      withRequest(
        {
          options: {
            transactionMeta: {
              hash: txHash,
              status: TransactionStatus.signed,
              id: '1',
              txParams: {
                from: addressFrom,
                to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
                maxFeePerGas: '0x2fd8a58d7',
                maxPriorityFeePerGas: '0xaa0f8a94',
                gas: '0x7b0d',
                nonce: '0x4b',
              },
              type: TransactionType.shieldSubscriptionApprove,
              chainId: CHAIN_IDS.MAINNET,
              networkClientId: 'testNetworkClientId',
              time: 1624408066355,
              defaultGasEstimates: {
                gas: '0x7b0d',
                gasPrice: '0x77359400',
              },
              securityProviderResponse: {
                flagAsDangerous: 0,
              },
            },
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          await submitSmartTransactionHook(request);

          // Status page should not be shown for shieldSubscriptionApprove transactions
          expect(startFlowSpy).not.toHaveBeenCalled();
          expect(addRequestSpy).not.toHaveBeenCalled();
        },
      );
    });

    it('shows status page for simpleSend transaction type', async () => {
      withRequest(
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          await submitSmartTransactionHook(request);

          // Status page should be shown for simpleSend transactions
          expect(startFlowSpy).toHaveBeenCalled();
          expect(addRequestSpy).toHaveBeenCalled();
        },
      );
    });

    it('shows status page for bridge transaction type when there are batch transactions', async () => {
      withRequest(
        {
          options: {
            transactionMeta: {
              hash: txHash,
              status: TransactionStatus.signed,
              id: '1',
              txParams: {
                from: addressFrom,
                to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
                maxFeePerGas: '0x2fd8a58d7',
                maxPriorityFeePerGas: '0xaa0f8a94',
                gas: '0x7b0d',
                nonce: '0x4b',
              },
              type: TransactionType.bridge,
              chainId: CHAIN_IDS.MAINNET,
              networkClientId: 'testNetworkClientId',
              time: 1624408066355,
              defaultGasEstimates: {
                gas: '0x7b0d',
                gasPrice: '0x77359400',
              },
              securityProviderResponse: {
                flagAsDangerous: 0,
              },
            },
            transactions: [
              {
                id: '1',
                signedTx: '0x1234',
                params: {
                  to: '0xf231d46dd78806e1dd93442cf33c7671f8538748',
                  value: '0x0',
                },
              },
            ],
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          await submitSmartTransactionHook(request);

          // Status page should be shown for bridge transactions with batch transactions
          expect(startFlowSpy).toHaveBeenCalled();
          expect(addRequestSpy).toHaveBeenCalled();
        },
      );
    });

    it('shows status page for simpleSend with batch transactions', async () => {
      withRequest(
        {
          options: {
            transactions: [
              {
                id: '1',
                signedTx: '0x1234',
                params: {
                  to: '0xf231d46dd78806e1dd93442cf33c7671f8538748',
                  value: '0x0',
                },
              },
            ],
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          await submitSmartTransactionHook(request);

          // Status page should be shown for simpleSend with batch transactions
          expect(startFlowSpy).toHaveBeenCalled();
          expect(addRequestSpy).toHaveBeenCalled();
        },
      );
    });
  });

  describe('extensionSkipSTXStatusPage feature flag', () => {
    it('skips status page when extensionSkipSTXStatusPage is true', async () => {
      withRequest(
        {
          options: {
            featureFlags: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
                extensionReturnTxHashAsapBatch: false,
                extensionSkipSmartTransactionStatusPage: true,
              },
            },
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          const result = await submitSmartTransactionHook(request);

          // Status page should NOT be shown when flag is true
          expect(startFlowSpy).not.toHaveBeenCalled();
          expect(addRequestSpy).not.toHaveBeenCalled();
          expect(result).toEqual({ transactionHash: txHash });
        },
      );
    });

    it('shows status page when extensionSkipSTXStatusPage is false', async () => {
      withRequest(
        {
          options: {
            featureFlags: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
                extensionReturnTxHashAsapBatch: false,
                extensionSkipSmartTransactionStatusPage: false,
              },
            },
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          const result = await submitSmartTransactionHook(request);

          // Status page should be shown when flag is false (existing logic applies)
          expect(startFlowSpy).toHaveBeenCalled();
          expect(addRequestSpy).toHaveBeenCalled();
          expect(result).toEqual({ transactionHash: txHash });
        },
      );
    });

    it('shows status page when extensionSkipSTXStatusPage is undefined (backwards compatible)', async () => {
      withRequest(
        {
          options: {
            featureFlags: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
                extensionReturnTxHashAsapBatch: false,
                // extensionSkipSTXStatusPage is not set (undefined)
              },
            },
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          const result = await submitSmartTransactionHook(request);

          // Status page should be shown when flag is undefined (existing logic applies)
          expect(startFlowSpy).toHaveBeenCalled();
          expect(addRequestSpy).toHaveBeenCalled();
          expect(result).toEqual({ transactionHash: txHash });
        },
      );
    });

    it('skips status page for bridge transactions when extensionSkipSTXStatusPage is true', async () => {
      withRequest(
        {
          options: {
            transactionMeta: {
              hash: txHash,
              status: TransactionStatus.signed,
              id: '1',
              txParams: {
                from: addressFrom,
                to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
                maxFeePerGas: '0x2fd8a58d7',
                maxPriorityFeePerGas: '0xaa0f8a94',
                gas: '0x7b0d',
                nonce: '0x4b',
              },
              type: TransactionType.bridge,
              chainId: CHAIN_IDS.MAINNET,
              networkClientId: 'testNetworkClientId',
              time: 1624408066355,
              defaultGasEstimates: {
                gas: '0x7b0d',
                gasPrice: '0x77359400',
              },
              securityProviderResponse: {
                flagAsDangerous: 0,
              },
            },
            featureFlags: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
                extensionReturnTxHashAsapBatch: false,
                extensionSkipSmartTransactionStatusPage: true,
              },
            },
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          const result = await submitSmartTransactionHook(request);

          // Status page should NOT be shown when flag is true (overrides existing logic)
          expect(startFlowSpy).not.toHaveBeenCalled();
          expect(addRequestSpy).not.toHaveBeenCalled();
          expect(result).toEqual({ transactionHash: txHash });
        },
      );
    });

    it('skips status page even with batch transactions when extensionSkipSTXStatusPage is true', async () => {
      withRequest(
        {
          options: {
            featureFlags: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
                extensionReturnTxHashAsapBatch: false,
                extensionSkipSmartTransactionStatusPage: true,
              },
            },
            transactions: [
              {
                id: '1',
                signedTx: '0x1234',
                params: {
                  to: '0xf231d46dd78806e1dd93442cf33c7671f8538748',
                  value: '0x0',
                },
              },
            ],
          },
        },
        async ({ request, messenger, startFlowSpy, addRequestSpy }) => {
          setImmediate(() => {
            messenger.publish('SmartTransactionsController:smartTransaction', {
              status: 'success',
              uuid,
              statusMetadata: {
                minedHash: txHash,
              },
            } as SmartTransaction);
          });

          const result = await submitSmartTransactionHook(request);

          // Status page should NOT be shown when flag is true, even with batch transactions
          expect(startFlowSpy).not.toHaveBeenCalled();
          expect(addRequestSpy).not.toHaveBeenCalled();
          expect(result).toEqual({ transactionHash: txHash });
        },
      );
    });
  });
});

describe('submitBatchSmartTransactionHook', () => {
  beforeEach(() => {
    addRequestCallback = () => undefined;
  });

  it('does not submit a transaction that is not a smart transaction', async () => {
    withRequest(
      {
        options: {
          isSmartTransaction: false,
        },
      },
      async ({ request }) => {
        await expect(submitBatchSmartTransactionHook(request)).rejects.toThrow(
          'submitBatch: Smart Transaction is required for batch submissions',
        );
      },
    );
  });

  it('throws an error if there is no uuid', async () => {
    withRequest(async ({ request }) => {
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          return { uuid: undefined };
        },
      );
      await expect(submitBatchSmartTransactionHook(request)).rejects.toThrow(
        'No smart transaction UUID',
      );
    });
  });

  it('throws an error if there is no transaction hash', async () => {
    withRequest(async ({ request, messenger }) => {
      setImmediate(() => {
        messenger.publish('SmartTransactionsController:smartTransaction', {
          status: 'cancelled',
          uuid,
          statusMetadata: {
            minedHash: '',
          },
        } as SmartTransaction);
      });
      await expect(submitBatchSmartTransactionHook(request)).rejects.toThrow(
        'Transaction does not have a transaction hash, there was a problem',
      );
    });
  });

  it('submits batch transactions from transactions array', async () => {
    withRequest(
      {
        options: {
          transactions: [
            {
              id: '1',
              signedTx: '0x1234',
              params: {
                to: '0xf231d46dd78806e1dd93442cf33c7671f8538748',
                value: '0x0',
              },
            },
            {
              id: '2',
              signedTx: '0x5678',
              params: {
                to: '0xf231d46dd78806e1dd93442cf33c7671f8538748',
                value: '0x0',
              },
            },
          ],
        },
      },
      async ({ request, messenger }) => {
        request.smartTransactionsController.submitSignedTransactions = jest.fn(
          async (_) => {
            return {
              uuid,
              txHashes: ['hash1', 'hash2'],
            };
          },
        );

        setImmediate(() => {
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'pending',
            uuid,
            statusMetadata: {
              minedHash: '',
            },
          } as SmartTransaction);
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'success',
            uuid,
            statusMetadata: {
              minedHash: txHash,
            },
          } as SmartTransaction);
        });

        const result = await submitBatchSmartTransactionHook(request);

        expect(result).toEqual({
          results: [{ transactionHash: 'hash1' }, { transactionHash: 'hash2' }],
        });

        expect(
          request.smartTransactionsController.submitSignedTransactions,
        ).toHaveBeenCalledWith({
          signedTransactions: ['0x1234', '0x5678'],
          signedCanceledTransactions: [],
          ...(request.transactionMeta?.txParams && {
            txParams: request.transactionMeta.txParams,
          }),
          ...(request.transactionMeta && {
            transactionMeta: request.transactionMeta,
          }),
        });
      },
    );
  });

  it('submits batch transaction and handles approval flow correctly', async () => {
    withRequest(
      async ({
        request,
        messenger,
        startFlowSpy,
        addRequestSpy,
        updateRequestStateSpy,
      }) => {
        request.smartTransactionsController.submitSignedTransactions = jest.fn(
          async (_) => {
            return {
              uuid,
              txHashes: ['hash1', 'hash2'],
            };
          },
        );

        setImmediate(() => {
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'pending',
            uuid,
            statusMetadata: {
              minedHash: '',
            },
          } as SmartTransaction);
          messenger.publish('SmartTransactionsController:smartTransaction', {
            status: 'success',
            uuid,
            statusMetadata: {
              minedHash: txHash,
            },
          } as SmartTransaction);
        });

        await submitBatchSmartTransactionHook(request);

        expect(startFlowSpy).toHaveBeenCalled();
        expect(addRequestSpy).toHaveBeenCalledWith(
          {
            id: 'approvalId',
            origin: 'http://localhost',
            type: 'smartTransaction:showSmartTransactionStatusPage',
            requestState: {
              smartTransaction: {
                status: 'pending',
                uuid,
                creationTime: expect.any(Number),
              },
              isDapp: true,
              txId,
            },
          },
          true,
        );

        addRequestCallback();

        expect(updateRequestStateSpy).toHaveBeenCalledWith({
          id: 'approvalId',
          requestState: {
            smartTransaction: {
              uuid,
              status: 'success',
              statusMetadata: {
                minedHash: txHash,
              },
            },
            isDapp: true,
            txId,
          },
        });
      },
    );
  });

  it('returns empty results array when no txHashes are returned', async () => {
    withRequest(async ({ request, messenger }) => {
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          return {
            uuid,
            txHashes: undefined,
          };
        },
      );

      setImmediate(() => {
        messenger.publish('SmartTransactionsController:smartTransaction', {
          status: 'success',
          uuid,
          statusMetadata: {
            minedHash: txHash,
          },
        } as SmartTransaction);
      });

      const result = await submitBatchSmartTransactionHook(request);

      expect(result).toEqual({
        results: [],
      });
    });
  });

  it('handles error during transaction submission', async () => {
    withRequest(async ({ request, endFlowSpy }) => {
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          throw new Error('Submission error');
        },
      );

      await expect(submitBatchSmartTransactionHook(request)).rejects.toThrow(
        'Submission error',
      );

      expect(endFlowSpy).toHaveBeenCalledWith({
        id: 'approvalId',
      });
    });
  });

  it('returns txHashes asap if extensionReturnTxHashAsapBatch feature flag is enabled', async () => {
    withRequest(async ({ request }) => {
      request.featureFlags.smartTransactions.extensionReturnTxHashAsapBatch = true;
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          return {
            uuid,
            txHashes: ['hash1', 'hash2'],
          };
        },
      );

      const result = await submitBatchSmartTransactionHook(request);

      expect(result).toEqual({
        results: [{ transactionHash: 'hash1' }, { transactionHash: 'hash2' }],
      });
    });
  });

  it('waits for transaction hash if extensionReturnTxHashAsapBatch is false', async () => {
    withRequest(async ({ request, messenger }) => {
      request.featureFlags.smartTransactions.extensionReturnTxHashAsapBatch = false;
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          return {
            uuid,
            txHashes: ['hash1', 'hash2'],
          };
        },
      );

      setImmediate(() => {
        messenger.publish('SmartTransactionsController:smartTransaction', {
          status: 'success',
          uuid,
          statusMetadata: {
            minedHash: txHash,
          },
        } as SmartTransaction);
      });

      const result = await submitBatchSmartTransactionHook(request);

      expect(result).toEqual({
        results: [{ transactionHash: 'hash1' }, { transactionHash: 'hash2' }],
      });
    });
  });
});
