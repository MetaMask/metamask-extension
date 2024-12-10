import {
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerOptions,
} from '@metamask/transaction-controller';
import { TransactionControllerInitMessenger } from '../messengers/transaction-controller-messenger';
import {
  buildControllerInitRequestMock,
  CHAIN_ID_MOCK,
  expectValidMessengerCallback,
} from '../test/utils';
import { TransactionControllerInit } from './transaction-controller-init';

jest.mock('@metamask/transaction-controller');

function buildInitRequestMock() {
  const requestMock = buildControllerInitRequestMock<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >();

  requestMock.getController.mockReturnValue({
    getNetworkClientRegistry: jest.fn().mockReturnValue({}),
  });

  return requestMock;
}

describe('Transaction Controller Init', () => {
  const transactionControllerClassMock = jest.mocked(TransactionController);

  function testConstructorProperty<
    T extends keyof TransactionControllerOptions,
  >(
    property: T,
    controllerProperties: Record<string, unknown> = {},
  ): TransactionControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    requestMock.getController.mockReturnValue({
      getNetworkClientRegistry: jest.fn().mockReturnValue({}),
      ...controllerProperties,
    });

    new TransactionControllerInit().init(requestMock);

    return transactionControllerClassMock.mock.calls[0][0][property];
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('init', () => {
    it('returns controller instance', () => {
      const requestMock = buildInitRequestMock();
      expect(new TransactionControllerInit().init(requestMock)).toBeInstanceOf(
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

      expect(getSavedGasFees?.(undefined as never)).toStrictEqual({
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
      const isSimulationEnabled = testConstructorProperty(
        'isSimulationEnabled',
        {
          state: {
            useTransactionSimulations: true,
          },
        },
      );

      expect(isSimulationEnabled?.()).toBe(true);
    });
  });

  describe('getControllerMessengerCallback', () => {
    it('returns a valid messenger callback', () => {
      expectValidMessengerCallback(
        new TransactionControllerInit().getControllerMessengerCallback(),
      );
    });
  });

  describe('getInitMessengerCallback', () => {
    it('returns a valid messenger callback', () => {
      expectValidMessengerCallback(
        new TransactionControllerInit().getInitMessengerCallback(),
      );
    });
  });
});
