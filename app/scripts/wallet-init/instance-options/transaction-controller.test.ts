import { it as jestIt } from '@jest/globals';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  getAccountAddressRelationship,
  TransactionController,
  TransactionMeta,
  TransactionType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import * as sentinelApiModule from '../../lib/transaction/sentinel-api';
import * as selectorsModule from '../../../../shared/lib/selectors';
import * as transactionMetricsModule from '../../lib/transaction/metrics';
import { createMockMessenger } from '../test-utils';
import { getTransactionControllerInitMessenger } from './transaction-controller-messenger';
import {
  getTransactionControllerApi,
  getTransactionControllerInstanceOptions,
  setupTransactionControllerListeners,
} from './transaction-controller';

jest.mock('@metamask/transaction-controller', () => {
  const actual = jest.requireActual('@metamask/transaction-controller');
  return {
    ...actual,
    getAccountAddressRelationship: jest.fn(),
  };
});
jest.mock('../../lib/smart-transaction/smart-transactions');
jest.mock('../../lib/transaction/sentinel-api');
jest.mock('../../../../shared/lib/selectors');
jest.mock('../../lib/transaction/hooks', () => ({
  getTransactionControllerHooks: jest.fn(() => ({ beforeSign: jest.fn() })),
}));
jest.mock('../../lib/transaction/metrics');

const CHAIN_ID_MOCK = '0x1';

describe('TransactionController wallet instance options', () => {
  const getIsSmartTransactionMock = jest.mocked(
    selectorsModule.getIsSmartTransaction,
  );

  const isSendBundleSupportedMock = jest.mocked(
    sentinelApiModule.isSendBundleSupported,
  );

  function buildOptions({
    preferencesState = {
      advancedGasFee: {},
      securityAlertsEnabled: false,
      useTransactionSimulations: false,
    },
  }: {
    preferencesState?: Record<string, unknown>;
  } = {}) {
    const rootMessenger = createMockMessenger();

    rootMessenger.registerActionHandler(
      'PreferencesController:getState',
      () => preferencesState as never,
    );

    const messenger = getTransactionControllerInitMessenger(rootMessenger);

    return getTransactionControllerInstanceOptions({
      initMessenger: messenger,
      request: {
        connectivityAdapter: {} as never,
        getFlatState: jest.fn(() => ({}) as never),
        getPermittedAccounts: jest.fn(() => []),
        getTransactionMetricsRequest: jest.fn(() => ({}) as never),
        infuraProjectId: 'fake-infura-project-id',
        messenger: rootMessenger,
        state: {},
      },
    });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    isSendBundleSupportedMock.mockResolvedValue(false);
  });

  it('retrieves saved gas fees from preferences', () => {
    const options = buildOptions({
      preferencesState: {
        advancedGasFee: {
          [CHAIN_ID_MOCK]: {
            maxBaseFee: '0x1',
            priorityFee: '0x2',
          },
        },
      },
    });

    expect(options.getSavedGasFees?.(CHAIN_ID_MOCK)).toStrictEqual({
      maxBaseFee: '0x1',
      priorityFee: '0x2',
    });
  });

  it('determines if first time interaction is enabled using preferences', () => {
    const options = buildOptions({
      preferencesState: {
        securityAlertsEnabled: true,
      },
    });

    expect(options.isFirstTimeInteractionEnabled?.()).toBe(true);
  });

  it('determines if simulation is enabled using preferences', () => {
    const options = buildOptions({
      preferencesState: {
        useTransactionSimulations: true,
      },
    });

    expect(options.isSimulationEnabled?.()).toBe(true);
  });

  describe('isAutomaticGasFeeUpdateEnabled', () => {
    function buildTransactionMeta(
      overrides: Partial<TransactionMeta> = {},
    ): TransactionMeta {
      return {
        chainId: CHAIN_ID_MOCK,
        id: '1',
        networkClientId: 'test-network',
        status: TransactionStatus.unapproved,
        time: Date.now(),
        txParams: {
          from: '0x0000000000000000000000000000000000000000',
        },
        type: TransactionType.contractInteraction,
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
      const options = buildOptions();

      expect(
        options.isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({ type }),
        ),
      ).toBe(expected);
    });

    it('returns false for transactions with nested relayDeposit type', () => {
      const options = buildOptions();

      expect(
        options.isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({
            nestedTransactions: [{ type: TransactionType.relayDeposit }],
            type: TransactionType.contractInteraction,
          }),
        ),
      ).toBe(false);
    });

    it('returns false for tokenMethodApprove with ORIGIN_METAMASK', () => {
      const options = buildOptions();

      expect(
        options.isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({
            origin: ORIGIN_METAMASK,
            type: TransactionType.tokenMethodApprove,
          }),
        ),
      ).toBe(false);
    });

    it('returns true for tokenMethodApprove with non-MetaMask origin', () => {
      const options = buildOptions();

      expect(
        options.isAutomaticGasFeeUpdateEnabled?.(
          buildTransactionMeta({
            origin: 'https://external-dapp.com',
            type: TransactionType.tokenMethodApprove,
          }),
        ),
      ).toBe(true);
    });
  });

  describe('isEIP7702GasFeeTokensEnabled', () => {
    const mockTransactionMeta = {
      chainId: CHAIN_ID_MOCK,
      id: '1',
      networkClientId: 'test-network',
      status: TransactionStatus.unapproved,
      time: Date.now(),
      txParams: {
        from: '0x0000000000000000000000000000000000000000',
      },
    } as TransactionMeta;

    it('returns true when smart transactions disabled and send bundle not supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isSendBundleSupportedMock.mockResolvedValue(false);

      const options = buildOptions();

      expect(
        await options.isEIP7702GasFeeTokensEnabled?.(mockTransactionMeta),
      ).toBe(true);
    });

    it('returns false when smart transactions enabled and send bundle supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(true);
      isSendBundleSupportedMock.mockResolvedValue(true);

      const options = buildOptions();

      expect(
        await options.isEIP7702GasFeeTokensEnabled?.(mockTransactionMeta),
      ).toBe(false);
    });

    it('returns true when smart transactions disabled and send bundle supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(false);
      isSendBundleSupportedMock.mockResolvedValue(true);

      const options = buildOptions();

      expect(
        await options.isEIP7702GasFeeTokensEnabled?.(mockTransactionMeta),
      ).toBe(true);
    });

    it('returns true when smart transactions enabled and send bundle not supported', async () => {
      getIsSmartTransactionMock.mockReturnValue(true);
      isSendBundleSupportedMock.mockResolvedValue(false);

      const options = buildOptions();
      expect(
        await options.isEIP7702GasFeeTokensEnabled?.(mockTransactionMeta),
      ).toBe(true);
    });

    it('returns true when isExternalSign is true', async () => {
      getIsSmartTransactionMock.mockReturnValue(true);
      isSendBundleSupportedMock.mockResolvedValue(true);

      const options = buildOptions();
      expect(
        await options.isEIP7702GasFeeTokensEnabled?.({
          ...mockTransactionMeta,
          isExternalSign: true,
        }),
      ).toBe(true);
    });
  });
});

describe('setupTransactionControllerListeners', () => {
  it('resolves transaction metrics lazily when controller events fire', () => {
    const rootMessenger = createMockMessenger();
    const messenger = getTransactionControllerInitMessenger(rootMessenger);
    const transactionMetricsRequest = { id: 'metrics-request' } as never;
    const getTransactionMetricsRequest = jest.fn(
      () => transactionMetricsRequest,
    );

    setupTransactionControllerListeners({
      getTransactionMetricsRequest,
      messenger,
    });

    expect(getTransactionMetricsRequest).not.toHaveBeenCalled();

    const transactionMeta = { id: '1' } as never;
    rootMessenger.publish(
      'TransactionController:transactionApproved',
      transactionMeta,
    );

    expect(getTransactionMetricsRequest).toHaveBeenCalledTimes(1);
    expect(
      jest.mocked(transactionMetricsModule.handleTransactionApproved),
    ).toHaveBeenCalledWith(transactionMetricsRequest, transactionMeta);
  });
});

describe('getTransactionControllerApi', () => {
  it('binds the TransactionController API and exposes first-time interaction checks', async () => {
    const transactionController = {
      abortTransactionSigning: jest.fn(),
      getLayer1GasFee: jest.fn(),
      getTransactions: jest.fn(),
      isAtomicBatchSupported: jest.fn(),
      updateAtomicBatchData: jest.fn(),
      updateBatchTransactions: jest.fn(),
      updateEditableParams: jest.fn(),
      updatePreviousGasParams: jest.fn(),
      updateSelectedGasFeeToken: jest.fn(),
      updateTransactionGasFees: jest.fn(),
    } as unknown as TransactionController;

    jest.mocked(getAccountAddressRelationship).mockResolvedValue({
      count: 0,
    } as never);

    const api = getTransactionControllerApi(transactionController);
    api.getTransactions({ limit: 1 } as never);

    expect(transactionController.getTransactions).toHaveBeenCalledWith({
      limit: 1,
    });
    await expect(
      api.checkFirstTimeInteraction({
        chainId: 1,
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000001',
      }),
    ).resolves.toBe(true);
  });

  it('returns undefined when first-time interaction cannot be determined', async () => {
    const api = getTransactionControllerApi({
      abortTransactionSigning: jest.fn(),
      getLayer1GasFee: jest.fn(),
      getTransactions: jest.fn(),
      isAtomicBatchSupported: jest.fn(),
      updateAtomicBatchData: jest.fn(),
      updateBatchTransactions: jest.fn(),
      updateEditableParams: jest.fn(),
      updatePreviousGasParams: jest.fn(),
      updateSelectedGasFeeToken: jest.fn(),
      updateTransactionGasFees: jest.fn(),
    } as unknown as TransactionController);

    jest
      .mocked(getAccountAddressRelationship)
      .mockRejectedValue(new Error('network failed'));

    await expect(
      api.checkFirstTimeInteraction({
        chainId: 1,
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000001',
      }),
    ).resolves.toBeUndefined();
  });
});
