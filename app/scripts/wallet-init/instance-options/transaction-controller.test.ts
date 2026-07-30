import { it as jestIt } from '@jest/globals';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import * as sentinelApiModule from '../../lib/transaction/sentinel-api';
import * as selectorsModule from '../../../../shared/lib/selectors';
import { createMockMessenger } from '../test-utils';
import { getTransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';
import { getTransactionControllerInstanceOptions } from './transaction-controller';

jest.mock('../../lib/smart-transaction/smart-transactions');
jest.mock('../../lib/transaction/sentinel-api');
jest.mock('../../../../shared/lib/selectors');
jest.mock('../../lib/transaction/hooks', () => ({
  getTransactionControllerHooks: jest.fn(() => ({ beforeSign: jest.fn() })),
}));

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
      getFlatState: jest.fn(() => ({}) as never),
      getPermittedAccounts: jest.fn(() => []),
      getTransactionMetricsRequest: jest.fn(() => ({}) as never),
    });
  }

  /**
   * Extract an option passed to the controller.
   *
   * @param option - The option to extract.
   * @param overrides - Optional overrides for the PreferencesController state.
   * @param overrides.preferencesState
   * @returns The extracted option.
   */
  function testConstructorOption<
    Option extends keyof ReturnType<typeof buildOptions>,
  >(
    option: Option,
    overrides: {
      preferencesState?: Record<string, unknown>;
    } = {},
  ): ReturnType<typeof buildOptions>[Option] {
    return buildOptions(overrides)[option];
  }

  beforeEach(() => {
    jest.resetAllMocks();
    isSendBundleSupportedMock.mockResolvedValue(false);
  });

  it('retrieves saved gas fees from preferences', () => {
    const getSavedGasFees = testConstructorOption('getSavedGasFees', {
      preferencesState: {
        advancedGasFee: {
          [CHAIN_ID_MOCK]: {
            '0xabc': {
              userFeeLevel: 'custom',
              maxBaseFee: '0x1',
              priorityFee: '0x2',
            },
          },
        },
      },
    });

    expect(
      getSavedGasFees?.({
        chainId: CHAIN_ID_MOCK,
        txParams: {
          from: '0xABC',
        },
      } as unknown as TransactionMeta),
    ).toStrictEqual({
      level: 'custom',
      maxBaseFee: '0x1',
      priorityFee: '0x2',
    });
  });

  it('does not retrieve saved gas fees for MetaMask Pay transactions', () => {
    const getSavedGasFees = testConstructorOption('getSavedGasFees', {
      preferencesState: {
        advancedGasFee: {
          [CHAIN_ID_MOCK]: {
            '0xabc': {
              userFeeLevel: 'custom',
              maxBaseFee: '0x1',
              priorityFee: '0x2',
            },
          },
        },
      },
    });

    expect(
      getSavedGasFees?.({
        chainId: CHAIN_ID_MOCK,
        metamaskPay: {},
        txParams: {
          from: '0xabc',
        },
      } as unknown as TransactionMeta),
    ).toBeUndefined();
  });

  it('determines if first time interaction is enabled using preferences', () => {
    const isFirstTimeInteractionEnabled = testConstructorOption(
      'isFirstTimeInteractionEnabled',
      {
        preferencesState: {
          securityAlertsEnabled: true,
        },
      },
    );

    expect(isFirstTimeInteractionEnabled?.()).toBe(true);
  });

  it('determines if simulation is enabled using preferences', () => {
    const isSimulationEnabled = testConstructorOption('isSimulationEnabled', {
      preferencesState: {
        useTransactionSimulations: true,
      },
    });

    expect(isSimulationEnabled?.()).toBe(true);
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
    const mockTransactionMeta = {
      id: '1',
      networkClientId: 'test-network',
      status: TransactionStatus.unapproved,
      chainId: CHAIN_ID_MOCK,
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
});
