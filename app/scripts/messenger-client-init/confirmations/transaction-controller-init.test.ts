import { NetworkController } from '@metamask/network-controller';
// Mocha type definitions are conflicting with Jest
import { it as jestIt } from '@jest/globals';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  ActionConstraint,
  Messenger,
  MockAnyNamespace,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
import {
  TransactionMeta,
  TransactionType,
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerOptions,
  TransactionStatus,
  PublishHook,
  PublishBatchHookRequest,
  PublishBatchHookTransaction,
} from '@metamask/transaction-controller';
import { TransactionPayPublishHook } from '@metamask/transaction-pay-controller';
import type { AccountOverviewTabKey } from '../../../../shared/constants/app-state';
import type { AppStateControllerSetDefaultHomeActiveTabNameAction } from '../../controllers/app-state-controller-method-action-types';
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
  TransactionControllerInitMessenger,
} from '../messengers/transaction-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import { MessengerClientInitRequest, MessengerClientName } from '../types';
import * as smartTransactionsModule from '../../lib/smart-transaction/smart-transactions';
import * as sentinelApiModule from '../../lib/transaction/sentinel-api';
import * as selectorsModule from '../../../../shared/lib/selectors';
import { Delegation7702PublishHook } from '../../lib/transaction/hooks/delegation-7702-publish';
import {
  TransactionControllerInit,
  publishHook,
} from './transaction-controller-init';

jest.mock('@metamask/transaction-controller');
jest.mock('@metamask/transaction-pay-controller');
jest.mock('../../lib/smart-transaction/smart-transactions');
jest.mock('../../lib/transaction/sentinel-api');
jest.mock('../../lib/transaction/hooks/delegation-7702-publish');
jest.mock('../../../../shared/lib/selectors');

/**
 * Build a mock NetworkController.
 *
 * @param partialMock - A partial mock object for the NetworkController, merged
 * with the default mock.
 * @returns A mock NetworkController.
 */
function buildControllerMock(
  partialMock?: Partial<NetworkController>,
): NetworkController {
  const defaultNetworkControllerMock = {
    getNetworkClientRegistry: jest.fn().mockReturnValue({}),
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultNetworkControllerMock,
    ...partialMock,
  };
}

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    AppStateControllerSetDefaultHomeActiveTabNameAction | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });
  baseControllerMessenger.registerActionHandler(
    'AppStateController:setDefaultHomeActiveTabName',
    (_defaultHomeActiveTabName: AccountOverviewTabKey | null) => undefined,
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTransactionControllerMessenger(
      baseControllerMessenger as never,
    ),
    initMessenger: getTransactionControllerInitMessenger(
      baseControllerMessenger as never,
    ),
  };

  requestMock.getMessengerClient.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('Transaction Controller Init', () => {
  const transactionControllerClassMock = jest.mocked(TransactionController);
  const transactionPayPublishHookClassMock = jest.mocked(
    TransactionPayPublishHook,
  );
  const payHookMock: jest.MockedFn<PublishHook> = jest.fn();

  /**
   * Extract a constructor option passed to the controller.
   *
   * @param option - The option to extract.
   * @param dependencyProperties - Any properties required on the controller dependencies.
   * @returns The extracted option.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function testConstructorOption<T extends keyof TransactionControllerOptions>(
    option: T,
    dependencyProperties: Record<string, unknown> = {},
  ): TransactionControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    requestMock.getMessengerClient.mockReturnValue(
      buildControllerMock(dependencyProperties),
    );

    TransactionControllerInit(requestMock);

    return transactionControllerClassMock.mock.calls[0][0][option];
  }

  beforeEach(() => {
    jest.resetAllMocks();

    transactionPayPublishHookClassMock.mockReturnValue({
      getHook: () => payHookMock,
    } as unknown as TransactionPayPublishHook);

    payHookMock.mockResolvedValue({
      transactionHash: undefined,
    });

    jest
      .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
      .mockReturnValue({
        isSmartTransaction: false,
        featureFlags: {
          extensionReturnTxHashAsap: false,
          extensionReturnTxHashAsapBatch: false,
          extensionSkipTransactionStatusPage: false,
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

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      TransactionControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(TransactionController);
  });

  it('retrieves saved gas fees from preferences', () => {
    const getSavedGasFees = testConstructorOption('getSavedGasFees', {
      state: {
        advancedGasFee: {
          [CHAIN_ID_MOCK]: {
            maxBaseFee: '0x1',
            priorityFee: '0x2',
          },
        },
      },
    });

    expect(getSavedGasFees?.(CHAIN_ID_MOCK)).toStrictEqual({
      maxBaseFee: '0x1',
      priorityFee: '0x2',
    });
  });

  describe('determines incoming transactions is disabled', () => {
    it('when useExternalServices is enabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: true,
            useExternalServices: true,
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });

    it('unless enabled in preferences but onboarding incomplete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: false,
            useExternalServices: true,
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });

    it('unless disabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: true,
            useExternalServices: false,
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });
  });

  it('determines if first time interaction enabled using preference', () => {
    const isFirstTimeInteractionEnabled = testConstructorOption(
      'isFirstTimeInteractionEnabled',
      {
        state: {
          securityAlertsEnabled: true,
        },
      },
    );

    expect(isFirstTimeInteractionEnabled?.()).toBe(true);
  });

  it('determines if simulation enabled using preference', () => {
    const isSimulationEnabled = testConstructorOption('isSimulationEnabled', {
      state: {
        useTransactionSimulations: true,
      },
    });

    expect(isSimulationEnabled?.()).toBe(true);
  });

  it('always disables pending transaction resubmit', () => {
    const pendingTransactions = testConstructorOption('pendingTransactions');

    expect(pendingTransactions?.isResubmitEnabled?.()).toBe(false);
  });

  describe('isAutomaticGasFeeUpdateEnabled', () => {
    function buildTransactionMeta(
      overrides: Partial<TransactionMeta> = {},
    ): TransactionMeta {
      return {
        id: '1',
        type: TransactionType.contractInteraction,
        chainId: CHAIN_ID_MOCK,
        networkClientId: 'test-network',
        status: TransactionStatus.unapproved,
        time: Date.now(),
        txParams: {
          from: '0x0000000000000000000000000000000000000000',
        },
        ...overrides,
      };
    }

    jestIt.each([
      ['swap', TransactionType.swap, false],
      ['swapApproval', TransactionType.swapApproval, false],
      ['bridge', TransactionType.bridge, false],
      ['bridgeApproval', TransactionType.bridgeApproval, false],
      ['relayDeposit', TransactionType.relayDeposit, false],
      ['perpsRelayDeposit', TransactionType.perpsRelayDeposit, false],
      ['predictRelayDeposit', TransactionType.predictRelayDeposit, false],
      ['contractInteraction', TransactionType.contractInteraction, true],
    ])('returns %s for %s transactions', (_label, type, expected) => {
      const isAutomaticGasFeeUpdateEnabled = testConstructorOption(
        'isAutomaticGasFeeUpdateEnabled',
      );

      expect(
        isAutomaticGasFeeUpdateEnabled?.(buildTransactionMeta({ type })),
      ).toBe(expected);
    });

    it('returns false for transactions with nested relayDeposit type', () => {
      const isAutomaticGasFeeUpdateEnabled = testConstructorOption(
        'isAutomaticGasFeeUpdateEnabled',
      );

      expect(
        isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({
            type: TransactionType.contractInteraction,
            nestedTransactions: [{ type: TransactionType.relayDeposit }],
          }),
        ),
      ).toBe(false);
    });

    it('returns false for tokenMethodApprove with ORIGIN_METAMASK', () => {
      const isAutomaticGasFeeUpdateEnabled = testConstructorOption(
        'isAutomaticGasFeeUpdateEnabled',
      );

      expect(
        isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({
            type: TransactionType.tokenMethodApprove,
            origin: ORIGIN_METAMASK,
          }),
        ),
      ).toBe(false);
    });

    it('returns true for tokenMethodApprove with non-MetaMask origin', () => {
      const isAutomaticGasFeeUpdateEnabled = testConstructorOption(
        'isAutomaticGasFeeUpdateEnabled',
      );

      expect(
        isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({
            type: TransactionType.tokenMethodApprove,
            origin: 'https://external-dapp.com',
          }),
        ),
      ).toBe(true);
    });
  });

  describe('isEIP7702GasFeeTokensEnabled', () => {
    const getIsSmartTransactionMock = jest.mocked(
      selectorsModule.getIsSmartTransaction,
    );

    const isSendBundleSupportedMock = jest.mocked(
      sentinelApiModule.isSendBundleSupported,
    );

    const mockTransactionMeta = {
      id: '1',
      status: TransactionStatus.unapproved,
      chainId: CHAIN_ID_MOCK,
      networkClientId: 'test-network',
      time: Date.now(),
      txParams: {
        from: '0x0000000000000000000000000000000000000000',
      },
    } as TransactionMeta;

    it('returns true when smart transactions disabled and send bundle not supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isSendBundleSupportedMock.mockResolvedValue(false);

      const optionFn = testConstructorOption('isEIP7702GasFeeTokensEnabled');

      expect(await optionFn?.(mockTransactionMeta)).toBe(true);
    });

    it('returns false when smart transactions enabled and send bundle supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(true);
      isSendBundleSupportedMock.mockResolvedValue(true);

      const optionFn = testConstructorOption('isEIP7702GasFeeTokensEnabled');

      expect(await optionFn?.(mockTransactionMeta)).toBe(false);
    });

    it('returns true when smart transactions disabled and send bundle supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isSendBundleSupportedMock.mockResolvedValue(true);

      const optionFn = testConstructorOption('isEIP7702GasFeeTokensEnabled');

      expect(await optionFn?.(mockTransactionMeta)).toBe(true);
    });

    it('returns true when smart transactions enabled and send bundle not supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(true);
      isSendBundleSupportedMock.mockResolvedValue(false);

      const optionFn = testConstructorOption('isEIP7702GasFeeTokensEnabled');

      expect(await optionFn?.(mockTransactionMeta)).toBe(true);
    });

    it('returns true when isExternalSign is true', async () => {
      getIsSmartTransactionMock.mockReturnValue(true);
      isSendBundleSupportedMock.mockResolvedValue(true);

      const optionFn = testConstructorOption('isEIP7702GasFeeTokensEnabled');

      expect(
        await optionFn?.({
          ...mockTransactionMeta,
          isExternalSign: true,
        }),
      ).toBe(true);
    });
  });

  describe('publish hook', () => {
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

    it('calls TransactionPayPublishHook', async () => {
      const hooks = testConstructorOption('hooks');

      await hooks?.publish?.(mockTransactionMeta);

      expect(payHookMock).toHaveBeenCalledTimes(1);
    });

    it('returns pay hook result when transactionHash is present', async () => {
      payHookMock.mockResolvedValue({
        transactionHash: '0xpayHash',
      });

      const hooks = testConstructorOption('hooks');

      const result = await hooks?.publish?.(mockTransactionMeta);

      expect(result).toStrictEqual({ transactionHash: '0xpayHash' });
    });

    it('skips Delegation7702PublishHook for hardware wallet accounts', async () => {
      const requestMock = buildInitRequestMock();
      requestMock.getMessengerClient.mockImplementation(((
        name: MessengerClientName,
      ) => {
        if (name === 'KeyringController') {
          return {
            getKeyringForAccount: jest.fn().mockResolvedValue({
              type: 'Ledger Hardware',
            }),
          };
        }
        return buildControllerMock();
      }) as unknown as MessengerClientInitRequest<
        TransactionControllerMessenger,
        TransactionControllerInitMessenger
      >['getMessengerClient']);

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];

      await hooks?.publish?.(mockTransactionMeta);

      expect(jest.mocked(Delegation7702PublishHook)).not.toHaveBeenCalled();
    });

    it('calls Delegation7702PublishHook for HD keyring accounts', async () => {
      const requestMock = buildInitRequestMock();
      requestMock.getMessengerClient.mockImplementation(((
        name: MessengerClientName,
      ) => {
        if (name === 'KeyringController') {
          return {
            getKeyringForAccount: jest.fn().mockResolvedValue({
              type: 'HD Key Tree',
            }),
          };
        }
        return buildControllerMock();
      }) as unknown as MessengerClientInitRequest<
        TransactionControllerMessenger,
        TransactionControllerInitMessenger
      >['getMessengerClient']);

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];

      await hooks?.publish?.({
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

      type PHArgs = Parameters<typeof publishHook>[0];
      await publishHook({
        flatState: {} as PHArgs['flatState'],
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: upsertFragmentMock,
          }) as unknown as ReturnType<PHArgs['getTransactionMetricsRequest']>,
        initMessenger: {
          call: jest.fn(),
        } as unknown as TransactionControllerInitMessenger,
        keyringController: {
          getKeyringForAccount: jest
            .fn()
            .mockResolvedValue({ type: 'HD Key Tree' }),
        },
        signedTx: '0xsigned',
        smartTransactionsController:
          {} as PHArgs['smartTransactionsController'],
        transactionController: {
          isAtomicBatchSupported: jest.fn(),
        } as unknown as PHArgs['transactionController'],
        transactionMeta: {
          ...mockTransactionMeta,
          isExternalSign: true,
        } as TransactionMeta,
      });

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
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitSmartTransactionHook)
        .mockResolvedValue({ transactionHash: '0xstxHash' });

      const upsertFragmentMock = jest.fn();

      type PHArgs = Parameters<typeof publishHook>[0];
      await publishHook({
        flatState: {} as PHArgs['flatState'],
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: upsertFragmentMock,
          }) as unknown as ReturnType<PHArgs['getTransactionMetricsRequest']>,
        initMessenger: {
          call: jest.fn(),
        } as unknown as TransactionControllerInitMessenger,
        keyringController: {
          getKeyringForAccount: jest
            .fn()
            .mockResolvedValue({ type: 'Ledger Hardware' }),
        },
        signedTx: '0xsigned',
        smartTransactionsController:
          {} as PHArgs['smartTransactionsController'],
        transactionController: {} as PHArgs['transactionController'],
        transactionMeta: mockTransactionMeta,
      });

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

      type PHArgs = Parameters<typeof publishHook>[0];
      const result = await publishHook({
        flatState: {} as PHArgs['flatState'],
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: jest
              .fn()
              .mockImplementation(() => {
                throw new Error('metrics error');
              }),
          }) as unknown as ReturnType<PHArgs['getTransactionMetricsRequest']>,
        initMessenger: {
          call: jest.fn(),
        } as unknown as TransactionControllerInitMessenger,
        keyringController: {
          getKeyringForAccount: jest
            .fn()
            .mockResolvedValue({ type: 'HD Key Tree' }),
        },
        signedTx: '0xsigned',
        smartTransactionsController:
          {} as PHArgs['smartTransactionsController'],
        transactionController: {
          isAtomicBatchSupported: jest.fn(),
        } as unknown as PHArgs['transactionController'],
        transactionMeta: {
          ...mockTransactionMeta,
          isExternalSign: true,
        } as TransactionMeta,
      });

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
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitSmartTransactionHook)
        .mockResolvedValue({ transactionHash: '0xstxHash' });

      type PHArgs = Parameters<typeof publishHook>[0];
      const result = await publishHook({
        flatState: {} as PHArgs['flatState'],
        getTransactionMetricsRequest: () =>
          ({
            upsertTransactionUIMetricsFragment: jest
              .fn()
              .mockImplementation(() => {
                throw new Error('metrics error');
              }),
          }) as unknown as ReturnType<PHArgs['getTransactionMetricsRequest']>,
        initMessenger: {
          call: jest.fn(),
        } as unknown as TransactionControllerInitMessenger,
        keyringController: {
          getKeyringForAccount: jest
            .fn()
            .mockResolvedValue({ type: 'Ledger Hardware' }),
        },
        signedTx: '0xsigned',
        smartTransactionsController:
          {} as PHArgs['smartTransactionsController'],
        transactionController: {} as PHArgs['transactionController'],
        transactionMeta: mockTransactionMeta,
      });

      expect(result).toStrictEqual({ transactionHash: '0xstxHash' });
    });
  });

  describe('publishBatch hook', () => {
    const mockTransactionMeta: TransactionMeta = {
      id: 'batch-tx-last',
      chainId: CHAIN_ID_MOCK,
      status: TransactionStatus.approved,
      time: Date.now(),
      txParams: {
        from: '0x0000000000000000000000000000000000000000',
      },
      networkClientId: 'test-network',
    };

    it('calls upsertTransactionUIMetricsFragment with sentinel_stx for each batch tx with an id on STX success', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        .mockResolvedValue({ results: [] });

      const upsertFragmentMock = jest.fn();
      const requestMock = buildInitRequestMock();
      requestMock.getTransactionMetricsRequest.mockReturnValue({
        upsertTransactionUIMetricsFragment: upsertFragmentMock,
      } as unknown as ReturnType<
        typeof requestMock.getTransactionMetricsRequest
      >);

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];
      const controllerInstance =
        transactionControllerClassMock.mock.instances[0];
      // @ts-expect-error Partial mock state
      controllerInstance.state = {
        transactions: [mockTransactionMeta],
      };

      await hooks?.publishBatch?.({
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

    it('skips upsertTransactionUIMetricsFragment for batch txs without an id', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        .mockResolvedValue({ results: [] });

      const upsertFragmentMock = jest.fn();
      const requestMock = buildInitRequestMock();
      requestMock.getTransactionMetricsRequest.mockReturnValue({
        upsertTransactionUIMetricsFragment: upsertFragmentMock,
      } as unknown as ReturnType<
        typeof requestMock.getTransactionMetricsRequest
      >);

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];
      const controllerInstance =
        transactionControllerClassMock.mock.instances[0];
      // @ts-expect-error Partial mock state
      controllerInstance.state = {
        transactions: [mockTransactionMeta],
      };

      await hooks?.publishBatch?.({
        transactions: [
          {} as unknown as PublishBatchHookTransaction,
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(upsertFragmentMock).toHaveBeenCalledTimes(1);
      expect(upsertFragmentMock).toHaveBeenCalledWith('batch-tx-last', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: { transaction_submission_method: 'sentinel_stx' },
      });
    });

    it('does not call upsertTransactionUIMetricsFragment when publishBatchHook returns undefined', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: false,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      const upsertFragmentMock = jest.fn();
      const requestMock = buildInitRequestMock();
      requestMock.getTransactionMetricsRequest.mockReturnValue({
        upsertTransactionUIMetricsFragment: upsertFragmentMock,
      } as unknown as ReturnType<
        typeof requestMock.getTransactionMetricsRequest
      >);

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];
      const controllerInstance =
        transactionControllerClassMock.mock.instances[0];
      // @ts-expect-error Partial mock state
      controllerInstance.state = {
        transactions: [mockTransactionMeta],
      };

      await hooks?.publishBatch?.({
        transactions: [
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(upsertFragmentMock).not.toHaveBeenCalled();
    });

    it('returns the result even if getTransactionMetricsRequest throws', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      const expectedResult = { results: [] };
      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        .mockResolvedValue(expectedResult);

      const requestMock = buildInitRequestMock();
      // getTransactionMetricsRequest is called once eagerly during init
      // (addTransactionControllerListeners); let that succeed, then throw on
      // the hook invocation to cover the try-catch guard.
      requestMock.getTransactionMetricsRequest
        .mockReturnValueOnce(
          {} as unknown as ReturnType<
            typeof requestMock.getTransactionMetricsRequest
          >,
        )
        .mockImplementation(() => {
          throw new Error('metrics request error');
        });

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];
      const controllerInstance =
        transactionControllerClassMock.mock.instances[0];
      // @ts-expect-error Partial mock state
      controllerInstance.state = {
        transactions: [mockTransactionMeta],
      };

      const result = await hooks?.publishBatch?.({
        transactions: [
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(result).toStrictEqual(expectedResult);
    });

    it('returns the result even if upsertTransactionUIMetricsFragment throws', async () => {
      jest
        .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
        .mockReturnValue({
          isSmartTransaction: true,
          featureFlags: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
          isHardwareWalletAccount: false,
        });

      const expectedResult = { results: [] };
      jest
        .mocked(smartTransactionsModule.submitBatchSmartTransactionHook)
        .mockResolvedValue(expectedResult);

      const requestMock = buildInitRequestMock();
      requestMock.getTransactionMetricsRequest.mockReturnValue({
        upsertTransactionUIMetricsFragment: jest.fn().mockImplementation(() => {
          throw new Error('metrics error');
        }),
      } as unknown as ReturnType<
        typeof requestMock.getTransactionMetricsRequest
      >);

      TransactionControllerInit(requestMock);

      const { hooks } = transactionControllerClassMock.mock.calls[0][0];
      const controllerInstance =
        transactionControllerClassMock.mock.instances[0];
      // @ts-expect-error Partial mock state
      controllerInstance.state = {
        transactions: [mockTransactionMeta],
      };

      const result = await hooks?.publishBatch?.({
        transactions: [
          { id: 'batch-tx-last' } as unknown as PublishBatchHookTransaction,
        ],
      } as unknown as PublishBatchHookRequest);

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
