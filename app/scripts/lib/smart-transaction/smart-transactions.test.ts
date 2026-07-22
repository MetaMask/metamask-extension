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
  AllowedEvents,
} from './smart-transactions';

const addressFrom = '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e';
const txHash =
  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356';
const uuid = 'uuid';
const txId = '1';

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
  submitSignedTransactionsSpy,
}: {
  request: SubmitSmartTransactionRequest;
  messenger: SmartTransactionsControllerMessenger;
  submitSignedTransactionsSpy: jest.SpyInstance;
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
    | TransactionControllerGetTransactionsAction
    | TransactionControllerUpdateTransactionAction,
    | MessengerEvents<SmartTransactionsControllerMessenger>
    | NetworkControllerStateChangeEvent
    | AllowedEvents
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  // Register RemoteFeatureFlagController:getState handler for the new controller
  messenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    jest.fn().mockReturnValue({
      remoteFeatureFlags: {
        smartTransactionsNetworks: {
          default: { extensionActive: true },
        },
      },
    }),
  );

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
      'TransactionController:failTransaction',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'NetworkController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
  });

  const smartTransactionsController = new SmartTransactionsController({
    messenger: smartTransactionsControllerMessenger,
    trackMetaMetricsEvent: jest.fn(),
    getMetaMetricsProps: jest.fn(),
    clientId: ClientId.Extension,
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
  const submitSignedTransactionsSpy = jest
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
      expectedDeadline: 45,
      maxDeadline: 150,
      extensionReturnTxHashAsap: false,
      extensionReturnTxHashAsapBatch: false,
    },
    ...options,
  };

  return fn({
    request,
    messenger: smartTransactionsControllerMessenger,
    submitSignedTransactionsSpy,
  });
}

describe('submitSmartTransactionHook', () => {
  it('does not submit a transaction that is not a smart transaction', async () => {
    await withRequest(
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
    await withRequest(async ({ request }) => {
      if (request.transactionMeta) {
        request.transactionMeta.type = TransactionType.swapAndSend;
      }
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('falls back to regular transaction submit if the transaction type is "swapApproval"', async () => {
    await withRequest(async ({ request }) => {
      if (request.transactionMeta) {
        request.transactionMeta.type = TransactionType.swapApproval;
      }
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('falls back to regular transaction submit if it is a legacy transaction', async () => {
    await withRequest(async ({ request }) => {
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
    await withRequest(async ({ request }) => {
      jest
        .spyOn(request.smartTransactionsController, 'getFees')
        .mockImplementation(() => {
          throw new Error('Backend call to /getFees failed');
        });
      const result = await submitSmartTransactionHook(request);
      expect(request.smartTransactionsController.getFees).toHaveBeenCalled();
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('skips getting fees if the transaction is signed and sponsored', async () => {
    await withRequest(async ({ request, submitSignedTransactionsSpy }) => {
      request.transactionMeta.isGasFeeSponsored = true;
      request.featureFlags.extensionReturnTxHashAsap = true;

      const result = await submitSmartTransactionHook(request);

      expect(
        request.smartTransactionsController.getFees,
      ).not.toHaveBeenCalled();
      expect(submitSignedTransactionsSpy).toHaveBeenCalled();
      expect(result).toEqual({ transactionHash: txHash });
    });
  });

  it('returns a txHash asap if the feature flag requires it', async () => {
    await withRequest(async ({ request }) => {
      request.featureFlags.extensionReturnTxHashAsap = true;
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: txHash });
    });
  });

  it('throws an error if there is no uuid', async () => {
    await withRequest(async ({ request }) => {
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
    await withRequest(async ({ request, messenger }) => {
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
    await withRequest(
      async ({ request, messenger, submitSignedTransactionsSpy }) => {
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
        expect(submitSignedTransactionsSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            signedTransactions: [request.signedTransactionInHex],
            signedCanceledTransactions: [],
            txParams,
            transactionMeta: request.transactionMeta,
          }),
        );
      },
    );
  });

  it('signs and submits a smart transaction', async () => {
    await withRequest(
      {
        options: {
          signedTransactionInHex: undefined,
        },
      },
      async ({ request, messenger, submitSignedTransactionsSpy }) => {
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
        expect(submitSignedTransactionsSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            signedTransactions: [createSignedTransaction()],
            signedCanceledTransactions: [],
            txParams,
            transactionMeta: request.transactionMeta,
          }),
        );
      },
    );
  });
});

describe('submitBatchSmartTransactionHook', () => {
  it('does not submit a transaction that is not a smart transaction', async () => {
    await withRequest(
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
    await withRequest(async ({ request }) => {
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
    await withRequest(async ({ request, messenger }) => {
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
    await withRequest(
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
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            signedTransactions: ['0x1234', '0x5678'],
            signedCanceledTransactions: [],
            ...(request.transactionMeta?.txParams && {
              txParams: request.transactionMeta.txParams,
            }),
            ...(request.transactionMeta && {
              transactionMeta: request.transactionMeta,
            }),
          }),
        );
      },
    );
  });

  it('returns empty results array when no txHashes are returned', async () => {
    await withRequest(async ({ request, messenger }) => {
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
    await withRequest(async ({ request }) => {
      request.smartTransactionsController.submitSignedTransactions = jest.fn(
        async (_) => {
          throw new Error('Submission error');
        },
      );

      await expect(submitBatchSmartTransactionHook(request)).rejects.toThrow(
        'Submission error',
      );
    });
  });

  it('returns txHashes asap if extensionReturnTxHashAsapBatch feature flag is enabled', async () => {
    await withRequest(async ({ request }) => {
      request.featureFlags.extensionReturnTxHashAsapBatch = true;
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
    await withRequest(async ({ request, messenger }) => {
      request.featureFlags.extensionReturnTxHashAsapBatch = false;
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
