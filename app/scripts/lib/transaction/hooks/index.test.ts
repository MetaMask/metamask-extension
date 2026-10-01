import {
  TransactionMeta,
  TransactionType,
  TransactionStatus,
  PublishHook,
  PublishBatchHookRequest,
  PublishBatchHookTransaction,
} from '@metamask/transaction-controller';
import {
  TransactionPayPublishHook,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import * as smartTransactionsModule from '../../smart-transaction/smart-transactions';
import * as sentinelApiModule from '../sentinel-api';
import { isGasFeeSponsored } from '../gas-sponsorship';
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
jest.mock('../gas-sponsorship');
jest.mock('./delegation-7702-publish');
jest.mock('./enforce-simulation-hook');

const CHAIN_ID_MOCK = '0x1';
const SIGNED_TX_MOCK = '0xsigned';

function buildMockMessenger(): TransactionControllerInitMessenger {
  return {
    call: jest.fn((action: string) =>
      action === 'KeyringController:getKeyringForAccount'
        ? { type: 'HD Key Tree' }
        : undefined,
    ),
  } as unknown as TransactionControllerInitMessenger;
}

function buildMockRequest(
  overrides: Partial<TransactionControllerHookRequest> = {},
): TransactionControllerHookRequest {
  return {
    getFlatState: jest.fn().mockReturnValue({ preferences: {} }),
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
          shouldSign: expect.any(Function),
          beforePublish: expect.any(Function),
          beforeSign: expect.any(Function),
          publish: expect.any(Function),
          publishBatch: expect.any(Function),
        }),
      );
    });
  });

  describe('afterAdd', () => {
    it('calls ShieldSubscriptionService:submitSubscriptionSponsorshipIntent', async () => {
      const messenger = buildMockMessenger();
      const request = buildMockRequest({ messenger });
      const { afterAdd } = getTransactionControllerHooks(request);

      await afterAdd?.({ transactionMeta: mockTransactionMeta });

      expect(messenger.call).toHaveBeenCalledWith(
        'ShieldSubscriptionService:submitSubscriptionSponsorshipIntent',
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

  describe('shouldSign', () => {
    const STX_PARAMS = {
      isSmartTransaction: true,
      featureFlags: {
        extensionReturnTxHashAsap: false,
        extensionReturnTxHashAsapBatch: false,
        mobileActive: false,
        extensionActive: false,
      },
      isHardwareWalletAccount: false,
    };

    it('signs locally by default', async () => {
      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({ transactionMeta: mockTransactionMeta }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('does not sign locally when Transaction Pay has quotes', async () => {
      const request = buildMockRequest({
        getFlatState: jest.fn().mockReturnValue({
          preferences: {},
          transactionData: {
            [mockTransactionMeta.id]: {
              quotes: [{ strategy: TransactionPayStrategy.Relay }],
            },
          },
        }),
      });
      const { shouldSign } = getTransactionControllerHooks(request);

      await expect(
        shouldSign?.({ transactionMeta: mockTransactionMeta }),
      ).resolves.toStrictEqual({ shouldSign: false });
      expect(isGasFeeSponsored).not.toHaveBeenCalled();
    });

    it('signs locally when Transaction Pay only has a direct-route quote', async () => {
      const request = buildMockRequest({
        getFlatState: jest.fn().mockReturnValue({
          preferences: {},
          transactionData: {
            [mockTransactionMeta.id]: {
              quotes: [{ strategy: TransactionPayStrategy.None }],
            },
          },
        }),
      });
      const { shouldSign } = getTransactionControllerHooks(request);

      await expect(
        shouldSign?.({ transactionMeta: mockTransactionMeta }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('does not sign Money Account withdrawals locally', async () => {
      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            nestedTransactions: [
              { type: TransactionType.moneyAccountWithdraw },
            ],
            type: TransactionType.batch,
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: false });
    });

    it('does not sign locally when sponsored through the 7702 relay', async () => {
      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);
      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({ transactionMeta: mockTransactionMeta }),
      ).resolves.toStrictEqual({ shouldSign: false });
    });

    it('signs sponsored Smart Transactions locally, including hardware accounts', async () => {
      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({ ...STX_PARAMS, isHardwareWalletAccount: true });
      jest
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);

      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({ transactionMeta: mockTransactionMeta }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('signs sponsored Money Account deposits locally', async () => {
      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);
      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
            selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
            type: TransactionType.batch,
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('does not sign a 7702 gas fee token transaction locally', async () => {
      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: false });
    });

    it('signs locally when a gas fee token can fall back to native balance', async () => {
      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            isGasFeeTokenIgnoredIfBalance: true,
            selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('signs Smart Transaction gas fee token batches locally', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue(STX_PARAMS);
      jest
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);

      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('signs gas fee token transactions locally for hardware accounts', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          ...STX_PARAMS,
          isSmartTransaction: false,
          isHardwareWalletAccount: true,
        });

      const { shouldSign } = getTransactionControllerHooks(buildMockRequest());

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: true });
    });

    it('signs locally when the account cannot publish through the 7702 relay', async () => {
      const messenger = buildMockMessenger();
      (messenger.call as jest.Mock).mockImplementation((action: string) =>
        action === 'KeyringController:getKeyringForAccount'
          ? { type: 'Snap Keyring' }
          : undefined,
      );
      const { shouldSign } = getTransactionControllerHooks(
        buildMockRequest({ messenger }),
      );

      await expect(
        shouldSign?.({
          transactionMeta: {
            ...mockTransactionMeta,
            selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
          },
        }),
      ).resolves.toStrictEqual({ shouldSign: true });
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

      await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

      expect(payHookMock).toHaveBeenCalledTimes(1);
    });

    it('returns pay hook result when transactionHash is present', async () => {
      payHookMock.mockResolvedValue({
        transactionHash: '0xpayHash',
      });

      const request = buildMockRequest();
      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

      expect(result).toStrictEqual({
        isGasFeeSponsored: false,
        transactionHash: '0xpayHash',
      });
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

      await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

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

      await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

      expect(jest.mocked(Delegation7702PublishHook)).toHaveBeenCalled();
    });

    it('passes the sponsorship decision to the delegation hook and returns it', async () => {
      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);

      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      delegation7702HookFn.mockResolvedValue({ transactionHash: '0xdelHash' });
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );

      const messenger = buildMockMessenger();
      const { publish } = getTransactionControllerHooks(
        buildMockRequest({ messenger }),
      );

      const result = await publish?.(mockTransactionMeta, '0x');

      expect(Delegation7702PublishHook).toHaveBeenCalledWith({
        isGasFeeSponsored: true,
        messenger,
      });
      expect(delegation7702HookFn).toHaveBeenCalledWith(
        mockTransactionMeta,
        '0x',
      );
      expect(result).toStrictEqual({
        isGasFeeSponsored: true,
        transactionHash: '0xdelHash',
      });
      expect(messenger.call).not.toHaveBeenCalledWith(
        'TransactionController:updateTransaction',
        expect.anything(),
        expect.anything(),
      );
    });

    it('routes gas fee token transactions through 7702 without sponsorship', async () => {
      const delegation7702HookFn: jest.MockedFn<PublishHook> = jest.fn();
      delegation7702HookFn.mockResolvedValue({ transactionHash: '0xdelHash' });
      jest.mocked(Delegation7702PublishHook).mockImplementation(
        () =>
          ({
            getHook: () => delegation7702HookFn,
          }) as unknown as Delegation7702PublishHook,
      );
      const messenger = buildMockMessenger();
      const { publish } = getTransactionControllerHooks(
        buildMockRequest({ messenger }),
      );

      const result = await publish?.(
        {
          ...mockTransactionMeta,
          selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
        },
        '0x',
      );

      expect(Delegation7702PublishHook).toHaveBeenCalledWith({
        isGasFeeSponsored: false,
        messenger,
      });
      expect(result).toStrictEqual({
        isGasFeeSponsored: false,
        transactionHash: '0xdelHash',
      });
    });

    it('returns the sponsorship decision with the pay hook result', async () => {
      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);
      payHookMock.mockResolvedValue({ transactionHash: '0xpayHash' });

      const { publish } = getTransactionControllerHooks(buildMockRequest());

      const result = await publish?.(
        {
          ...mockTransactionMeta,
          nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
          type: TransactionType.batch,
        },
        '0x',
      );

      expect(result).toStrictEqual({
        isGasFeeSponsored: true,
        transactionHash: '0xpayHash',
      });
    });

    it('routes sponsored Money Account withdrawals through the 7702 relay', async () => {
      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);
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
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);

      const messenger = buildMockMessenger();
      const { publish } = getTransactionControllerHooks(
        buildMockRequest({ messenger }),
      );

      await publish?.(
        {
          ...mockTransactionMeta,
          nestedTransactions: [{ type: TransactionType.moneyAccountWithdraw }],
          type: TransactionType.batch,
        },
        '0x',
      );

      expect(Delegation7702PublishHook).toHaveBeenCalledWith({
        isGasFeeSponsored: true,
        messenger,
      });
    });

    it('normalizes an empty Smart Transaction signature before publishing', async () => {
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
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);
      jest
        .mocked(smartTransactionsModule.submitSmartTransactionHook)
        .mockResolvedValue({ transactionHash: '0xstxHash' });

      const { publish } = getTransactionControllerHooks(buildMockRequest());
      const publishHook = publish as PublishHook;

      const result = await publishHook(
        {
          ...mockTransactionMeta,
          selectedGasFeeToken: '0x0000000000000000000000000000000000000001',
        },
        '0x',
      );

      expect(Delegation7702PublishHook).not.toHaveBeenCalled();
      expect(
        smartTransactionsModule.submitSmartTransactionHook,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ signedTransactionInHex: undefined }),
      );
      expect(result).toStrictEqual({
        isGasFeeSponsored: false,
        transactionHash: '0xstxHash',
      });
    });

    it('passes the sponsorship decision to locally signed hardware Smart Transactions', async () => {
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
          isHardwareWalletAccount: true,
        });
      jest
        .mocked(sentinelApiModule.isSendBundleSupported)
        .mockResolvedValue(true);

      const messenger = buildMockMessenger();
      const { publish } = getTransactionControllerHooks(
        buildMockRequest({ messenger }),
      );
      const publishHook = publish as PublishHook;

      jest.mocked(isGasFeeSponsored).mockResolvedValue(true);
      jest
        .mocked(smartTransactionsModule.submitSmartTransactionHook)
        .mockResolvedValue({ transactionHash: '0xstxHash' });

      const result = await publishHook(mockTransactionMeta, '0xsigned');

      expect(payHookMock).toHaveBeenCalledWith(mockTransactionMeta, '0xsigned');
      expect(Delegation7702PublishHook).not.toHaveBeenCalled();
      expect(
        smartTransactionsModule.submitSmartTransactionHook,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          isGasFeeSponsored: true,
          signedTransactionInHex: '0xsigned',
          transactionMeta: mockTransactionMeta,
        }),
      );
      expect(result).toStrictEqual({
        isGasFeeSponsored: true,
        transactionHash: '0xstxHash',
      });
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

      await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

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

      await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

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

      const result = await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

      expect(result).toStrictEqual({
        isGasFeeSponsored: false,
        transactionHash: '0xdelHash',
      });
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

      const result = await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

      expect(result).toStrictEqual({
        isGasFeeSponsored: false,
        transactionHash: '0xstxHash',
      });
    });

    it('returns transactionHash undefined when no hooks match', async () => {
      const request = buildMockRequest();
      const { publish } = getTransactionControllerHooks(request);

      const result = await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

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

      await publish?.(mockTransactionMeta, SIGNED_TX_MOCK);

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

      const result = await publish?.(
        {
          ...mockTransactionMeta,
          isGasFeeIncluded: true,
        },
        SIGNED_TX_MOCK,
      );

      expect(delegation7702HookFn).toHaveBeenCalled();
      expect(result).toStrictEqual({
        isGasFeeSponsored: false,
        transactionHash: '0xdelHash',
      });
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

      const result = await publish?.(
        {
          ...mockTransactionMeta,
          type: TransactionType.revokeDelegation,
        },
        SIGNED_TX_MOCK,
      );

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
