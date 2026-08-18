import {
  TransactionPayController,
  TransactionPayControllerMessenger,
} from '@metamask/transaction-pay-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTransactionPayControllerMessenger,
  getTransactionPayControllerInitMessenger,
  TransactionPayControllerInitMessenger,
} from './messengers';
import { TransactionPayControllerInit } from './transaction-pay-controller-init';

jest.mock('@metamask/transaction-pay-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    TransactionPayControllerMessenger,
    TransactionPayControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTransactionPayControllerMessenger(baseMessenger),
    initMessenger: getTransactionPayControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('TransactionPayControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      TransactionPayControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(TransactionPayController);
  });

  it('passes the proper arguments to the controller', () => {
    TransactionPayControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TransactionPayController);
    expect(controllerMock).toHaveBeenCalledWith({
      getDelegationTransaction: expect.any(Function),
      getStrategy: expect.any(Function),
      messenger: expect.any(Object),
      state: undefined,
    });
  });

  describe('api.setTransactionPayPostQuote', () => {
    function initApi() {
      const { api, messengerClient } =
        TransactionPayControllerInit(getInitRequestMock());
      if (!api) {
        throw new Error('Expected init result to expose an api');
      }
      const setTransactionConfigMock = jest.mocked(
        messengerClient.setTransactionConfig,
      );
      return { api, setTransactionConfigMock };
    }

    it('flips `isPostQuote` and `isHyperliquidSource` when isHyperliquidSource is set', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayPostQuote('tx-1', { isHyperliquidSource: true });

      expect(setTransactionConfigMock).toHaveBeenCalledWith(
        'tx-1',
        expect.any(Function),
      );

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: {
        isPostQuote?: boolean;
        isHyperliquidSource?: boolean;
      } = {};
      updater(config as never);

      expect(config).toEqual({ isPostQuote: true, isHyperliquidSource: true });
    });

    it('only sets `isPostQuote` when no options are provided', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayPostQuote('tx-2');

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: {
        isPostQuote?: boolean;
        isHyperliquidSource?: boolean;
      } = {};
      updater(config as never);

      expect(config).toEqual({ isPostQuote: true });
    });

    it('does not set `isHyperliquidSource` when explicitly false', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayPostQuote('tx-3', { isHyperliquidSource: false });

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: {
        isPostQuote?: boolean;
        isHyperliquidSource?: boolean;
      } = {};
      updater(config as never);

      expect(config).toEqual({ isPostQuote: true });
    });
  });

  describe('api.setTransactionPayAccountOverride', () => {
    function initApi() {
      const { api, messengerClient } =
        TransactionPayControllerInit(getInitRequestMock());
      if (!api) {
        throw new Error('Expected init result to expose an api');
      }
      const setTransactionConfigMock = jest.mocked(
        messengerClient.setTransactionConfig,
      );
      return { api, setTransactionConfigMock };
    }

    it('writes the supplied address to config.accountOverride', () => {
      const { api, setTransactionConfigMock } = initApi();
      const accountOverride =
        '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      api.setTransactionPayAccountOverride('tx-1', accountOverride);

      expect(setTransactionConfigMock).toHaveBeenCalledWith(
        'tx-1',
        expect.any(Function),
      );

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: { accountOverride?: string } = {};
      updater(config as never);

      expect(config).toEqual({ accountOverride });
    });
  });

  describe('api.setTransactionPayPaymentOverride', () => {
    function initApi() {
      const { api, messengerClient } =
        TransactionPayControllerInit(getInitRequestMock());
      if (!api) {
        throw new Error('Expected init result to expose an api');
      }
      const setTransactionConfigMock = jest.mocked(
        messengerClient.setTransactionConfig,
      );
      return { api, setTransactionConfigMock };
    }

    it('writes paymentOverride and refundTo', () => {
      const { api, setTransactionConfigMock } = initApi();
      const refundTo = '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      api.setTransactionPayPaymentOverride('tx-1', {
        paymentOverride: 'moneyAccount' as never,
        refundTo,
      });

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: {
        paymentOverride?: string;
        refundTo?: string;
      } = {};
      updater(config as never);

      expect(config).toEqual({
        paymentOverride: 'moneyAccount',
        refundTo,
      });
    });

    it('clears paymentOverride and refundTo when override is undefined', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayPaymentOverride('tx-2', {
        paymentOverride: undefined,
      });

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: {
        paymentOverride?: string;
        refundTo?: string;
      } = {
        paymentOverride: 'moneyAccount',
        refundTo: '0xabc',
      };
      updater(config as never);

      expect(config).toEqual({
        paymentOverride: undefined,
        refundTo: undefined,
      });
    });
  });
});
