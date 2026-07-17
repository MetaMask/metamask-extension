import {
  TransactionMeta,
  TransactionType,
  TransactionStatus,
  PublishHook,
  PublishBatchHookRequest,
  PublishBatchHookTransaction,
} from '@metamask/transaction-controller';
import { TransactionPayPublishHook } from '@metamask/transaction-pay-controller';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import * as smartTransactionsModule from '../../smart-transaction/smart-transactions';
import * as sentinelApiModule from '../sentinel-api';
import { Delegation7702PublishHook } from './delegation-7702-publish';
import { EnforceSimulationHook } from './enforce-simulation-hook';
import {
  getTransactionControllerHooks,
  type TransactionControllerHookRequest,
} from '.';

jest.mock('@metamask/transaction-controller');
jest.mock('@metamask/transaction-pay-controller');
jest.mock('../../smart-transaction/smart-transactions');
jest.mock('../sentinel-api');
jest.mock('./delegation-7702-publish');
jest.mock('./enforce-simulation-hook');

const CHAIN_ID_MOCK = '0x1';

function buildMockMessenger(): TransactionControllerInitMessenger {
  return {
    call: jest.fn(),
  } as unknown as TransactionControllerInitMessenger;
}

function buildMockRequest(
  overrides: Partial<TransactionControllerHookRequest> = {},
): TransactionControllerHookRequest {
  return {
    getFlatState: jest.fn().mockReturnValue({}),
    getTransactionMetricsRequest: jest.fn().mockReturnValue({
      upsertTransactionUIMetricsFragment: jest.fn(),
    }),
    messenger: buildMockMessenger(),
    ...overrides,
  };
}

describe('Transaction Controller Hooks', () => {
  const payHookMock: jest.MockedFn<PublishHook> = jest.fn();

  const mockTransactionMeta: TransactionMeta = {
    id: '123',
    chainId: CHAIN_ID_MOCK,
    status: TransactionStatus.approved,
    time: Date.now(),
    txParams: {
      from: '0x0000000000000000000000000000000000000000',
    },
    networkClientId: 'test-network',
  };

  const enforceSimulationGetBeforeSignHookMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    jest.mocked(TransactionPayPublishHook).mockReturnValue({
      getHook: () => payHookMock,
    } as unknown as TransactionPayPublishHook);

    payHookMock.mockResolvedValue({
      transactionHash: undefined,
    });

    enforceSimulationGetBeforeSignHookMock.mockReturnValue(jest.fn());
    jest.mocked(EnforceSimulationHook).mockReturnValue({
      getBeforeSignHook: enforceSimulationGetBeforeSignHookMock,
    } as unknown as EnforceSimulationHook);

    jest
      .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
      .mockReturnValue({
        isSmartTransaction: false,
        featureFlags: {
          extensionReturnTxHashAsap: false,
          extensionReturnTxHashAsapBatch: false,
          mobileActive: false,
          extensionActive: false,
        },
        isHardwareWalletAccount: false,
      });

    jest
      .mocked(sentinelApiModule.isSendBundleSupported)
      .mockResolvedValue(false);

    const delegation7702HookMock: jest.MockedFn<PublishHook> = jest.fn();
    delegation7702HookMock.mockResolvedValue({ transactionHash: undefined });
    jest.mocked(Delegation7702PublishHook).mockImplementation(
      () =>
        ({
          getHook: () => delegation7702HookMock,
        }) as unknown as Delegation7702PublishHook,
    );
  });

  describe('getTransactionControllerHooks', () => {
    it('returns all hook functions', () => {
      const request = buildMockRequest();
      const hooks = getTransactionControllerHooks(request);

      expect(hooks).toStrictEqual(
        expect.objectContaining({
          afterAdd: expect.any(Function),
          beforePublish: expect.any(Function),
          beforeSign: expect.any(Function),
          publish: expect.any(Function),
          publishBatch: expect.any(Function),
        }),
      );
    });
  });

  describe('afterAdd', () => {
    it('calls SubscriptionService:submitSubscriptionSponsorshipIntent', async () => {
      const messenger = buildMockMessenger();
      const request = buildMockRequest({ messenger });
      const { afterAdd } = getTransactionControllerHooks(request);

      await afterAdd?.({ transactionMeta: mockTransactionMeta });

      expect(messenger.call).toHaveBeenCalledWith(
        'SubscriptionService:submitSubscriptionSponsorshipIntent',
        mockTransactionMeta,
      );
    });

    it('returns an empty object', async () => {
      const request = buildMockRequest();
      const { afterAdd } = getTransactionControllerHooks(request);

      const result = await afterAdd?.({
        transactionMeta: mockTransactionMeta,
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('beforePublish', () => {
    it('calls InstitutionalSnapController:publishHook with transactionMeta', () => {
      const messenger = buildMockMessenger();
      const request = buildMockRequest({ messenger });
      const { beforePublish } = getTransactionControllerHooks(request);

      beforePublish?.(mockTransactionMeta);

      expect(messenger.call).toHaveBeenCalledWith(
        'InstitutionalSnapController:publishHook',
        mockTransactionMeta,
      );
    });
  });

  describe('beforeSign', () => {
    it('creates EnforceSimulationHook and returns its getBeforeSignHook result', () => {
      const expectedHook = jest.fn();
      enforceSimulationGetBeforeSignHookMock.mockReturnValue(expectedHook);

      const request = buildMockRequest();
      const { beforeSign } = getTransactionControllerHooks(request);

      expect(EnforceSimulationHook).toHaveBeenCalledWith(
        expect.objectContaining({
          messenger: request.messenger,
          isEligible: expect.any(Function),
        }),
      );
      expect(beforeSign).toBe(expectedHook);
    });
  });

  describe('beforeCheckPendingTransaction', () => {
    // Not returned by getTransactionControllerHooks — omitted pending assessment
    // of its impact on EIP-7702 delegation transactions. The hook is intentionally
    // kept here until it can be safely re-enabled.
    it('is not included in the returned hooks', () => {
      const request = buildMockRequest();
      const hooks = getTransactionControllerHooks(request);

      expect(hooks).not.toHaveProperty('beforeCheckPendingTransaction');
    });
  });

  describe('publish', () => {
    it('calls TransactionPayPublishHook', async () => {
      const request = buildMockRequest();
      const { publish } = getTransactionControllerHooks(request);

      await publish?.(mockTransactionMeta);

      expect(payHookMock).toHaveBeenCalledTimes(1);
    });

    it('returns pay hook result when transactionHash is present', async () => {
      payHookMock.mockResolvedValue({
        transactionHash: '0xpayHash',
      });

      const request = buildMockRequest();
      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.(mockTransactionMeta);

      expect(result).toStrictEqual({ transactionHash: '0xpayHash' });
    });

    it('skips Delegation7702PublishHook for hardware wallet accounts', async () => {
      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) => {
        if (action === 'KeyringController:getKeyringForAccount') {
          return { type: 'Ledger Hardware' };
        }
        return undefined;
      });

      const request = buildMockRequest({ messenger });
      const { publish } = getTransactionControllerHooks(request);

      await publish?.(mockTransactionMeta);

      expect(jest.mocked(Delegation7702PublishHook)).not.toHaveBeenCalled();
    });

    it('calls Delegation7702PublishHook for HD keyring accounts', async () => {
      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) => {
        if (action === 'KeyringController:getKeyringForAccount') {
          return { type: 'HD Key Tree' };
        }
        return undefined;
      });

      const request = buildMockRequest({ messenger });
      const { publish } = getTransactionControllerHooks(request);

      await publish?.({
        ...mockTransactionMeta,
        isExternalSign: true,
      } as TransactionMeta);

      expect(jest.mocked(Delegation7702PublishHook)).toHaveBeenCalled();
    });

    it('records sentinel_relay submission via metrics fragment on delegation hook success', async () => {
      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      delegation7702HookFn.mockResolvedValue({ transactionHash: '0xdelHash' });
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );

      const upsertFragmentMock = jest.fn();
      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) => {
        if (action === 'KeyringController:getKeyringForAccount') {
          return { type: 'HD Key Tree' };
        }
        return undefined;
      });

      const request = buildMockRequest({
        messenger,
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: upsertFragmentMock,
          }) as never,
      });

      const { publish } = getTransactionControllerHooks(request);

      await publish?.({
        ...mockTransactionMeta,
        isExternalSign: true,
      } as TransactionMeta);

      expect(upsertFragmentMock).toHaveBeenCalledWith(mockTransactionMeta.id, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: { transaction_submission_method: 'sentinel_relay' },
      });
    });

    it('records sentinel_stx submission via metrics fragment on STX hook success', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitSmartTransactionHook)
        .mockResolvedValue({ transactionHash: '0xstxHash' });

      const upsertFragmentMock = jest.fn();
      const request = buildMockRequest({
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: upsertFragmentMock,
          }) as never,
      });

      const { publish } = getTransactionControllerHooks(request);

      await publish?.(mockTransactionMeta);

      expect(upsertFragmentMock).toHaveBeenCalledWith(mockTransactionMeta.id, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: { transaction_submission_method: 'sentinel_stx' },
      });
    });

    it('returns transaction hash even if upsertTransactionUIMetricsFragment throws on sentinel_relay path', async () => {
      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      delegation7702HookFn.mockResolvedValue({ transactionHash: '0xdelHash' });
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) => {
        if (action === 'KeyringController:getKeyringForAccount') {
          return { type: 'HD Key Tree' };
        }
        return undefined;
      });

      const request = buildMockRequest({
        messenger,
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: jest
              .fn()
              .mockImplementation(() => {
                throw new Error('metrics error');
              }),
          }) as never,
      });

      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.({
        ...mockTransactionMeta,
        isExternalSign: true,
      } as TransactionMeta);

      expect(result).toStrictEqual({ transactionHash: '0xdelHash' });
    });

    it('returns transaction hash even if upsertTransactionUIMetricsFragment throws on sentinel_stx path', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitSmartTransactionHook)
        .mockResolvedValue({ transactionHash: '0xstxHash' });

      const request = buildMockRequest({
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: jest
              .fn()
              .mockImplementation(() => {
                throw new Error('metrics error');
              }),
          }) as never,
      });

      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.(mockTransactionMeta);

      expect(result).toStrictEqual({ transactionHash: '0xstxHash' });
    });

    it('returns transactionHash undefined when no hooks match', async () => {
      const request = buildMockRequest();
      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.(mockTransactionMeta);

      expect(result).toStrictEqual({ transactionHash: undefined });
    });

    it('sets Activity tab when a hook was attempted but fell back', async () => {
      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      delegation7702HookFn.mockResolvedValue({ transactionHash: undefined });
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) => {
        if (action === 'KeyringController:getKeyringForAccount') {
          return { type: 'HD Key Tree' };
        }
        return undefined;
      });

      const request = buildMockRequest({ messenger });
      const { publish } = getTransactionControllerHooks(request);

      await publish?.({
        ...mockTransactionMeta,
        isExternalSign: true,
      } as TransactionMeta);

      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setDefaultHomeActiveTabName',
        expect.anything(),
      );
    });

    it('calls Delegation7702PublishHook when isGasFeeIncluded is true even on STX+sendBundle chain', async () => {
      jest
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);

      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      delegation7702HookFn.mockResolvedValue({
        transactionHash: '0xdelHash',
      });
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) => {
        if (action === 'KeyringController:getKeyringForAccount') {
          return { type: 'HD Key Tree' };
        }
        return undefined;
      });

      const request = buildMockRequest({ messenger });
      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.({
        ...mockTransactionMeta,
        isGasFeeIncluded: true,
      } as TransactionMeta);

      expect(delegation7702HookFn).toHaveBeenCalled();
      expect(result).toStrictEqual({ transactionHash: '0xdelHash' });
    });

    it('bypasses Delegation7702PublishHook for revokeDelegation on a sponsored chain', async () => {
      jest
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);

      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );

      const request = buildMockRequest();
      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.({
        ...mockTransactionMeta,
        type: TransactionType.revokeDelegation,
      } as TransactionMeta);

      expect(delegation7702HookFn).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('publishBatch', () => {
    const mockBatchTransactionMeta: TransactionMeta = {
      id: 'batch-tx-last',
      chainId: CHAIN_ID_MOCK,
      status: TransactionStatus.approved,
      time: Date.now(),
      txParams: {
        from: '0x0000000000000000000000000000000000000000',
      },
      networkClientId: 'test-network',
    };

    it('calls submitBatchSmartTransactionHook when isSmartTransaction is true', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        .mockResolvedValue({ results: [] });

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockReturnValue({
        transactions: [mockBatchTransactionMeta],
      });

      const request = buildMockRequest({ messenger });
      const { publishBatch } = getTransactionControllerHooks(request);

      await publishBatch?.({
        transactions: [
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(
        smartTransactionsModule.submitBatchSmartTransactionHook,
      ).toHaveBeenCalled();
    });

    it('throws when transaction is not found', async () => {
      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockReturnValue({
        transactions: [],
      });

      const request = buildMockRequest({ messenger });
      const { publishBatch } = getTransactionControllerHooks(request);

      await expect(
        publishBatch?.({
          transactions: [
            {
              id: 'nonexistent',
            } as unknown as PublishBatchHookTransaction,
          ],
        } as unknown as PublishBatchHookRequest),
      ).rejects.toThrow(
        'publishBatchSmartTransactionHook: Could not find transaction with id nonexistent',
      );
    });

    it('records sentinel_stx metrics for each batch transaction on successful STX submission', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        .mockResolvedValue({ results: [] });

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockReturnValue({
        transactions: [mockBatchTransactionMeta],
      });

      const upsertFragmentMock = jest.fn();
      const request = buildMockRequest({
        messenger,
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: upsertFragmentMock,
          }) as never,
      });

      const { publishBatch } = getTransactionControllerHooks(request);

      await publishBatch?.({
        transactions: [
          { id: 'batch-tx-1' } as unknown as PublishBatchHookTransaction,
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(upsertFragmentMock).toHaveBeenCalledTimes(2);
      expect(upsertFragmentMock).toHaveBeenCalledWith('batch-tx-1', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: { transaction_submission_method: 'sentinel_stx' },
      });
      expect(upsertFragmentMock).toHaveBeenCalledWith('batch-tx-last', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: { transaction_submission_method: 'sentinel_stx' },
      });
    });

    it('does not record metrics when STX batch submission returns a falsy result', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(undefined as any);

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockReturnValue({
        transactions: [mockBatchTransactionMeta],
      });

      const upsertFragmentMock = jest.fn();
      const request = buildMockRequest({
        messenger,
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: upsertFragmentMock,
          }) as never,
      });

      const { publishBatch } = getTransactionControllerHooks(request);

      await publishBatch?.({
        transactions: [
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(upsertFragmentMock).not.toHaveBeenCalled();
    });

    it('returns undefined when isSmartTransaction is false', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: false,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockReturnValue({
        transactions: [mockBatchTransactionMeta],
      });

      const request = buildMockRequest({ messenger });
      const { publishBatch } = getTransactionControllerHooks(request);

      const result = await publishBatch?.({
        transactions: [
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(result).toBeUndefined();
    });
  });
});
