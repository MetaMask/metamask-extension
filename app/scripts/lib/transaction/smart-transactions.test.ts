import {
  TransactionType,
  TransactionStatus,
  TransactionController,
} from '@metamask/transaction-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import SmartTransactionsController, {
  SmartTransactionsControllerMessenger,
} from '@metamask/smart-transactions-controller';
import { NetworkControllerStateChangeEvent } from '@metamask/network-controller';
import type { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { submitSmartTransactionHook } from './smart-transactions';
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
  const controllerMessenger = new ControllerMessenger<
    AllowedActions,
    NetworkControllerStateChangeEvent | AllowedEvents
  >();

  const startFlowSpy = jest.fn().mockResolvedValue({ id: 'approvalId' });
  controllerMessenger.registerActionHandler(
    'ApprovalController:startFlow',
    startFlowSpy,
  );

  const addRequestSpy = jest.fn().mockImplementation(() => ({
    then: (callback: () => void) => {
      addRequestCallback = callback;
    },
  }));
  controllerMessenger.registerActionHandler(
    'ApprovalController:addRequest',
    addRequestSpy,
  );

  const updateRequestStateSpy = jest.fn();
  controllerMessenger.registerActionHandler(
    'ApprovalController:updateRequestState',
    updateRequestStateSpy,
  );

  const endFlowSpy = jest.fn();
  controllerMessenger.registerActionHandler(
    'ApprovalController:endFlow',
    endFlowSpy,
  );

  const messenger = controllerMessenger.getRestricted({
    name: 'SmartTransactionsController',
    allowedActions: [],
    allowedEvents: ['NetworkController:stateChange'],
  });

  const smartTransactionsController = new SmartTransactionsController({
    messenger,
    getNonceLock: jest.fn(),
    confirmExternalTransaction: jest.fn(),
    trackMetaMetricsEvent: jest.fn(),
    getTransactions: jest.fn(),
    getMetaMetricsProps: jest.fn(),
    clientId: ClientId.Extension,
    getFeatureFlags: jest.fn(),
    updateTransaction: jest.fn(),
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
        gasPrice: '0x77359400',
        gas: '0x7b0d',
        nonce: '0x4b',
      },
      type: TransactionType.simpleSend,
      chainId: CHAIN_IDS.MAINNET,
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
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
    controllerMessenger,
    featureFlags: {
      extensionActive: true,
      mobileActive: false,
      smartTransactions: {
        expectedDeadline: 45,
        maxDeadline: 150,
        extensionReturnTxHashAsap: false,
      },
    },
    ...options,
  };

  return fn({
    request,
    messenger,
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
      request.transactionMeta.type = TransactionType.swapAndSend;
      const result = await submitSmartTransactionHook(request);
      expect(result).toEqual({ transactionHash: undefined });
    });
  });

  it('falls back to regular transaction submit if the transaction type is "swapApproval"', async () => {
    withRequest(async ({ request }) => {
      request.transactionMeta.type = TransactionType.swapApproval;
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
      expect(endFlowSpy).toHaveBeenCalledWith({
        id: 'approvalId',
      });
      expect(result).toEqual({ transactionHash: undefined });
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
        const { txParams } = request.transactionMeta;
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
        const { txParams, chainId } = request.transactionMeta;
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
        const { txParams } = request.transactionMeta;
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
});
