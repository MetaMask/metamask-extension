import {
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerOptions,
} from '@metamask/transaction-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
  TransactionControllerInitMessenger,
} from '../messengers/transaction-controller-messenger';
import { ControllerInitRequest } from '../types';
import { TransactionControllerInit } from './transaction-controller-init';

jest.mock('@metamask/transaction-controller');

function buildControllerMock(options?: Record<string, unknown>) {
  return {
    getNetworkClientRegistry: jest.fn().mockReturnValue({}),
    ...options,
  } as unknown as TransactionController;
}

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >
> {
  const baseControllerMessenger = new ControllerMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTransactionControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getTransactionControllerInitMessenger(
      baseControllerMessenger,
    ),
  };

  requestMock.getController.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('Transaction Controller Init', () => {
  const transactionControllerClassMock = jest.mocked(TransactionController);

  /**
   * Extract a constructor option passed to the controller.
   *
   * @param option - The option to extract.
   * @param controllerOptions - Any other controller options to initialize the controller with.
   * @returns The extracted option.
   */
  function testConstructorOption<T extends keyof TransactionControllerOptions>(
    option: T,
    controllerOptions: Record<string, unknown> = {},
  ): TransactionControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    requestMock.getController.mockReturnValue(
      buildControllerMock(controllerOptions),
    );

    TransactionControllerInit(requestMock);

    return transactionControllerClassMock.mock.calls[0][0][option];
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(TransactionControllerInit(requestMock).controller).toBeInstanceOf(
      TransactionController,
    );
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

  describe('determines incoming transactions is enabled', () => {
    it('when enabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
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
      const incomingTransactionsIsEnabled = testConstructorOption(
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
      const incomingTransactionsIsEnabled = testConstructorOption(
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
});
