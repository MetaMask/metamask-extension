import {
  TransactionController,
  TransactionControllerOptions,
} from '@metamask/transaction-controller';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import { TransactionControllerInit } from './transaction-controller-init';

jest.mock('@metamask/transaction-controller');

describe('Transaction Controller Init', () => {
  const transactionControllerClassMock = jest.mocked(TransactionController);

  function testConstructorProperty<
    T extends keyof TransactionControllerOptions,
  >(
    property: T,
    controllerProperties: Record<string, unknown> = {},
  ): TransactionControllerOptions[T] {
    const requestMock = buildControllerInitRequestMock();

    // @ts-expect-error Mocked subset of full state object
    requestMock.getController.mockReturnValue({
      getNetworkClientRegistry: jest.fn().mockReturnValue({}),
      ...controllerProperties,
    });

    TransactionControllerInit(requestMock);

    return transactionControllerClassMock.mock.calls[0][0][property];
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildControllerInitRequestMock();
    expect(TransactionControllerInit(requestMock).controller).toBeInstanceOf(
      TransactionController,
    );
  });

  it('retrieves saved gas fees from preferences', () => {
    const getSavedGasFees = testConstructorProperty('getSavedGasFees', {
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

  describe('determines incoming transactions is enabled', () => {
    it('when enabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorProperty(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: true,
            incomingTransactionsPreferences: {
              [CHAIN_ID_MOCK]: true,
            },
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(true);
    });

    it('unless enabled in preferences but onboarding incomplete', () => {
      const incomingTransactionsIsEnabled = testConstructorProperty(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: false,
            incomingTransactionsPreferences: {
              [CHAIN_ID_MOCK]: true,
            },
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });

    it('unless disabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorProperty(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: true,
            incomingTransactionsPreferences: {
              [CHAIN_ID_MOCK]: false,
            },
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });
  });

  it('determines if first time interaction enabled using preference', () => {
    const isFirstTimeInteractionEnabled = testConstructorProperty(
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
    const isSimulationEnabled = testConstructorProperty('isSimulationEnabled', {
      state: {
        useTransactionSimulations: true,
      },
    });

    expect(isSimulationEnabled?.()).toBe(true);
  });
});
