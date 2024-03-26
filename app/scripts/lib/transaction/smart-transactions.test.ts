import EventEmitter from 'events';
import {
  TransactionType,
  TransactionStatus,
  TransactionController,
} from '@metamask/transaction-controller';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SmartTransactionHook } from './smart-transactions';
import type {
  SubmitSmartTransactionRequest,
  SmartTransactionsControllerMessenger,
} from './smart-transactions';

const addressFrom = '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e';
const txHash =
  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356';

type SubmitSmartTransactionRequestMocked = SubmitSmartTransactionRequest & {
  smartTransactionsController: jest.Mocked<SmartTransactionsController>;
  transactionController: jest.Mocked<TransactionController>;
};

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

const createSmartTransactionsControllerMessengerMock = () => {
  return {
    call: jest.fn((type) => {
      if (type === 'ApprovalController:addRequest') {
        return {
          then: () => undefined,
        };
      }
      return Promise.resolve({ id: 'approvalId' });
    }),
  } as unknown as jest.Mocked<SmartTransactionsControllerMessenger>;
};

const createSmartTransactionsControllerMock = () => {
  return {
    getFees: jest.fn(async () => {
      return {
        tradeTxFees: {
          cancelFees: [],
          feeEstimate: 42000000000000,
          fees: [
            { maxFeePerGas: 12843636951, maxPriorityFeePerGas: 2853145236 },
          ],
          gasLimit: 21000,
          gasUsed: 21000,
        },
      };
    }),
    submitSignedTransactions: jest.fn(async () => {
      return {
        uuid: 'uuid',
        txHash,
      };
    }),
    eventEmitter: new EventEmitter(),
  } as unknown as jest.Mocked<SmartTransactionsController>;
};

describe('submitSmartTransactionHook', () => {
  const createRequest = () => {
    return {
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
        error: {
          name: 'Error',
          message: 'Details of the error',
        },
        securityProviderResponse: {
          flagAsDangerous: 0,
        },
      },
      smartTransactionsController: createSmartTransactionsControllerMock(),
      transactionController: createTransactionControllerMock(),
      isSmartTransaction: true,
      controllerMessenger: createSmartTransactionsControllerMessengerMock(),
      featureFlags: {
        smartTransactions: {
          returnTxHashAsap: false,
        },
      },
    };
  };

  it('does not submit a transaction that is not a smart transaction', async () => {
    const request: SubmitSmartTransactionRequestMocked = createRequest();
    request.isSmartTransaction = false;
    const smartTransactionHook = new SmartTransactionHook();
    const result = await smartTransactionHook.submit(request);
    expect(result).toEqual({ transactionHash: undefined });
  });

  it('returns a txHash asap if the feature flag requires it', async () => {
    const request: SubmitSmartTransactionRequestMocked = createRequest();
    request.featureFlags.smartTransactions.returnTxHashAsap = true;
    const smartTransactionHook = new SmartTransactionHook();
    const result = await smartTransactionHook.submit(request);
    expect(result).toEqual({ transactionHash: txHash });
  });

  it('throws an error if there is no uuid', async () => {
    const request: SubmitSmartTransactionRequestMocked = createRequest();
    request.smartTransactionsController.submitSignedTransactions = jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ signedTransactions, signedCanceledTransactions }) => {
        return { uuid: undefined };
      },
    );
    const smartTransactionHook = new SmartTransactionHook();
    await expect(smartTransactionHook.submit(request)).rejects.toThrow(
      'No smart transaction UUID',
    );
  });

  it('throws an error if there is no transaction hash', async () => {
    const request: SubmitSmartTransactionRequestMocked = createRequest();
    setImmediate(() => {
      request.smartTransactionsController.eventEmitter.emit(
        `uuid:smartTransaction`,
        {
          status: 'cancelled',
          statusMetadata: {
            minedHash: '',
          },
        },
      );
    });
    const smartTransactionHook = new SmartTransactionHook();
    await expect(smartTransactionHook.submit(request)).rejects.toThrow(
      'Transaction does not have a transaction hash, there was a problem',
    );
  });

  it('submits a smart transaction', async () => {
    const request: SubmitSmartTransactionRequestMocked = createRequest();
    const smartTransactionHook = new SmartTransactionHook();
    setImmediate(() => {
      request.smartTransactionsController.eventEmitter.emit(
        `uuid:smartTransaction`,
        {
          status: 'pending',
          statusMetadata: {
            minedHash: '',
          },
        },
      );
      request.smartTransactionsController.eventEmitter.emit(
        `uuid:smartTransaction`,
        {
          status: 'success',
          statusMetadata: {
            minedHash: txHash,
          },
        },
      );
    });
    const result = await smartTransactionHook.submit(request);
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
    smartTransactionHook.onApproveOrReject(request.controllerMessenger);
    expect(request.controllerMessenger.call).toHaveBeenCalledTimes(4);
    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:startFlow',
    );
    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:addRequest',
      {
        id: 'approvalId',
        origin: 'http://localhost',
        type: 'smartTransaction:showSmartTransactionStatusPage',
        requestState: {
          smartTransaction: {
            status: 'pending',
            creationTime: expect.any(Number),
          },
          isDapp: true,
        },
      },
      true,
    );
    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:updateRequestState',
      {
        id: 'approvalId',
        requestState: {
          smartTransaction: {
            status: 'success',
            statusMetadata: {
              minedHash:
                '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356',
            },
          },
          isDapp: true,
        },
      },
    );

    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:endFlow',
      {
        id: 'approvalId',
      },
    );
  });

  it('submits a smart transaction and does not update approval request if approval was already approved or rejected', async () => {
    const request: SubmitSmartTransactionRequestMocked = createRequest();
    const smartTransactionHook = new SmartTransactionHook();
    setImmediate(() => {
      request.smartTransactionsController.eventEmitter.emit(
        `uuid:smartTransaction`,
        {
          status: 'pending',
          statusMetadata: {
            minedHash: '',
          },
        },
      );
      smartTransactionHook.onApproveOrReject(request.controllerMessenger);
      request.smartTransactionsController.eventEmitter.emit(
        `uuid:smartTransaction`,
        {
          status: 'success',
          statusMetadata: {
            minedHash: txHash,
          },
        },
      );
    });
    const result = await smartTransactionHook.submit(request);
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
    expect(request.controllerMessenger.call).toHaveBeenCalledTimes(3);
    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:startFlow',
    );
    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:addRequest',
      {
        id: 'approvalId',
        origin: 'http://localhost',
        type: 'smartTransaction:showSmartTransactionStatusPage',
        requestState: {
          smartTransaction: {
            status: 'pending',
            creationTime: expect.any(Number),
          },
          isDapp: true,
        },
      },
      true,
    );
    expect(request.controllerMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:endFlow',
      {
        id: 'approvalId',
      },
    );
  });
});
