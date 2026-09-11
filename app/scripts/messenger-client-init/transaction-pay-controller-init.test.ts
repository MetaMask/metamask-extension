import {
  TransactionPayController,
  TransactionPayControllerMessenger,
} from '@metamask/transaction-pay-controller';
import { getRootMessenger } from '../lib/messenger';
import { createMoneyAccountDepositTransaction } from '../lib/money/pay/create-deposit-transaction';
import { createMoneyAccountWithdrawTransaction } from '../lib/money/pay/create-withdraw-transaction';
import {
  getMoneyAccountAmountData,
  updateMoneyAccountDepositAmount,
} from '../lib/money/pay/update-deposit-amount';
import { getPaymentOverrideData } from '../lib/money/pay/payment-override-callback';
import { updateMoneyAccountWithdrawAmount } from '../lib/money/pay/update-withdraw-amount';
import { getDelegationTransaction } from '../lib/transaction/delegation';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTransactionPayControllerMessenger,
  getTransactionPayControllerInitMessenger,
  TransactionPayControllerInitMessenger,
} from './messengers';
import { TransactionPayControllerInit } from './transaction-pay-controller-init';

jest.mock('@metamask/transaction-pay-controller');
jest.mock('../lib/transaction/delegation', () => ({
  getDelegationTransaction: jest.fn(),
}));
jest.mock('../lib/money/pay/create-deposit-transaction', () => ({
  createMoneyAccountDepositTransaction: jest.fn(),
}));
jest.mock('../lib/money/pay/create-withdraw-transaction', () => ({
  createMoneyAccountWithdrawTransaction: jest.fn(),
}));
jest.mock('../lib/money/pay/update-deposit-amount', () => ({
  getMoneyAccountAmountData: jest.fn(),
  updateMoneyAccountDepositAmount: jest.fn(),
}));
jest.mock('../lib/money/pay/payment-override-callback', () => ({
  getPaymentOverrideData: jest.fn(),
}));
jest.mock('../lib/money/pay/update-withdraw-amount', () => ({
  updateMoneyAccountWithdrawAmount: jest.fn(),
}));

const createDepositTransactionMock = jest.mocked(
  createMoneyAccountDepositTransaction,
);
const createWithdrawTransactionMock = jest.mocked(
  createMoneyAccountWithdrawTransaction,
);
const updateDepositAmountMock = jest.mocked(updateMoneyAccountDepositAmount);
const updateWithdrawAmountMock = jest.mocked(updateMoneyAccountWithdrawAmount);
const getMoneyAccountAmountDataMock = jest.mocked(getMoneyAccountAmountData);
const getPaymentOverrideDataMock = jest.mocked(getPaymentOverrideData);

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
      getAmountData: expect.any(Function),
      getDelegationTransaction: expect.any(Function),
      getPaymentOverrideData: expect.any(Function),
      getStrategy: expect.any(Function),
      messenger: expect.any(Object),
      state: undefined,
    });
  });

  it('forwards isSubsidized to getDelegationTransaction', async () => {
    TransactionPayControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TransactionPayController);
    const lastCall =
      controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
    const getDelegationTransactionCallback =
      lastCall.getDelegationTransaction as (request: {
        transaction: { id: string };
        isSubsidized?: boolean;
      }) => Promise<unknown>;

    const transaction = { id: 'tx-1' };
    await getDelegationTransactionCallback({
      transaction,
      isSubsidized: true,
    });

    expect(jest.mocked(getDelegationTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({ isSubsidized: true }),
      transaction,
    );
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

  describe('api.setTransactionPayIsMaxAmount', () => {
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

    it('sets isMaxAmount without touching atomic by default', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayIsMaxAmount('tx-1', true);

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: { isMaxAmount?: boolean; atomic?: boolean } = {};
      updater(config as never);

      expect(config).toEqual({ isMaxAmount: true });
    });

    it('sets atomic false for a max money-account deposit', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayIsMaxAmount('tx-1', true, {
        isMoneyAccountDeposit: true,
      });

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: { isMaxAmount?: boolean; atomic?: boolean } = {};
      updater(config as never);

      expect(config).toEqual({ isMaxAmount: true, atomic: false });
    });

    it('clears atomic when max is unset on a money-account deposit', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayIsMaxAmount('tx-1', false, {
        isMoneyAccountDeposit: true,
      });

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: { isMaxAmount?: boolean; atomic?: boolean } = {
        atomic: false,
      };
      updater(config as never);

      expect(config).toEqual({ isMaxAmount: false, atomic: undefined });
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
        atomic?: boolean;
      } = {
        paymentOverride: 'moneyAccount',
        refundTo: '0xabc',
        atomic: false,
      };
      updater(config as never);

      expect(config).toEqual({
        paymentOverride: undefined,
        refundTo: undefined,
        atomic: undefined,
      });
    });

    it('writes atomic when supplied', () => {
      const { api, setTransactionConfigMock } = initApi();

      api.setTransactionPayPaymentOverride('tx-3', {
        paymentOverride: 'moneyAccount' as never,
        atomic: false,
      });

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: {
        paymentOverride?: string;
        atomic?: boolean;
      } = {};
      updater(config as never);

      expect(config).toEqual({
        paymentOverride: 'moneyAccount',
        atomic: false,
      });
    });
  });

  describe('api.createMoneyAccountDepositTransaction', () => {
    const BATCH_ID = '0xb47c41d0000000000000000000000000' as const;
    const ACCOUNT_OVERRIDE =
      '0xabcdef1234567890abcdef1234567890abcdef12' as const;

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

    beforeEach(() => {
      createDepositTransactionMock.mockResolvedValue({
        transactionId: 'tx-deposit',
        batchId: BATCH_ID,
      });
    });

    it('seeds accountOverride and requires a quote after creating the batch', async () => {
      const { api, setTransactionConfigMock } = initApi();

      const result = await api.createMoneyAccountDepositTransaction(
        BATCH_ID,
        ACCOUNT_OVERRIDE,
      );

      expect(result).toEqual({
        transactionId: 'tx-deposit',
        batchId: BATCH_ID,
      });
      expect(createDepositTransactionMock).toHaveBeenCalledWith(
        expect.anything(),
        BATCH_ID,
      );

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: { accountOverride?: string; isQuoteRequired?: boolean } =
        {};
      updater(config as never);

      expect(setTransactionConfigMock).toHaveBeenCalledWith(
        'tx-deposit',
        expect.any(Function),
      );
      expect(config).toEqual({
        accountOverride: ACCOUNT_OVERRIDE,
        isQuoteRequired: true,
      });
    });
  });

  describe('api.createMoneyAccountWithdrawTransaction', () => {
    const ACCOUNT_OVERRIDE =
      '0xabcdef1234567890abcdef1234567890abcdef12' as const;

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

    beforeEach(() => {
      createWithdrawTransactionMock.mockResolvedValue({
        transactionId: 'tx-withdraw',
        batchId: '0x1234',
      });
    });

    it('seeds the selected account as accountOverride after creating the batch', async () => {
      const { api, setTransactionConfigMock } = initApi();

      const result =
        await api.createMoneyAccountWithdrawTransaction(ACCOUNT_OVERRIDE);

      expect(result).toEqual({
        transactionId: 'tx-withdraw',
        batchId: '0x1234',
      });
      expect(createWithdrawTransactionMock).toHaveBeenCalledTimes(1);

      const updater = setTransactionConfigMock.mock.calls[0][1];
      const config: { accountOverride?: string } = {};
      updater(config as never);

      expect(setTransactionConfigMock).toHaveBeenCalledWith(
        'tx-withdraw',
        expect.any(Function),
      );
      expect(config).toEqual({ accountOverride: ACCOUNT_OVERRIDE });
    });
  });

  describe('api.updateMoneyAccountDepositAmount', () => {
    it('forwards the transaction id and human amount', async () => {
      const { api } = TransactionPayControllerInit(getInitRequestMock());
      if (!api) {
        throw new Error('Expected init result to expose an api');
      }
      updateDepositAmountMock.mockResolvedValue(true);

      const result = await api.updateMoneyAccountDepositAmount('tx-1', '10');

      expect(result).toBe(true);
      expect(updateDepositAmountMock).toHaveBeenCalledWith(
        expect.anything(),
        'tx-1',
        '10',
      );
    });
  });

  describe('api.updateMoneyAccountWithdrawAmount', () => {
    it('forwards the Pay account override from controller state', async () => {
      const { api, messengerClient } =
        TransactionPayControllerInit(getInitRequestMock());
      if (!api) {
        throw new Error('Expected init result to expose an api');
      }
      const accountOverride =
        '0xabcdef1234567890abcdef1234567890abcdef12' as const;
      (
        messengerClient as {
          state: {
            transactionData: Record<string, { accountOverride?: string }>;
          };
        }
      ).state = {
        transactionData: { 'tx-1': { accountOverride } },
      };
      updateWithdrawAmountMock.mockResolvedValue({
        withdrawData: '0xaaa1',
        transferData: '0xbbb2',
      });

      const result = await api.updateMoneyAccountWithdrawAmount('tx-1', '10');

      expect(result).toStrictEqual({
        withdrawData: '0xaaa1',
        transferData: '0xbbb2',
      });
      expect(updateWithdrawAmountMock).toHaveBeenCalledWith(
        expect.anything(),
        'tx-1',
        '10',
        accountOverride,
      );
    });

    it('prefers the recipient override over the Pay account override', async () => {
      const { api, messengerClient } =
        TransactionPayControllerInit(getInitRequestMock());
      if (!api) {
        throw new Error('Expected init result to expose an api');
      }
      const payOverride = '0xabcdef1234567890abcdef1234567890abcdef12' as const;
      const recipientOverride =
        '0x1111111111111111111111111111111111111111' as const;
      (
        messengerClient as {
          state: {
            transactionData: Record<string, { accountOverride?: string }>;
          };
        }
      ).state = {
        transactionData: { 'tx-1': { accountOverride: payOverride } },
      };
      updateWithdrawAmountMock.mockResolvedValue({
        withdrawData: '0xaaa1',
        transferData: '0xbbb2',
      });

      await api.updateMoneyAccountWithdrawAmount(
        'tx-1',
        '10',
        recipientOverride,
      );

      expect(updateWithdrawAmountMock).toHaveBeenCalledWith(
        expect.anything(),
        'tx-1',
        '10',
        recipientOverride,
      );
    });
  });

  it('forwards getAmountData to getMoneyAccountAmountData', async () => {
    TransactionPayControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TransactionPayController);
    const lastCall =
      controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
    getMoneyAccountAmountDataMock.mockResolvedValue({ updates: [] });

    const request = {
      amount: '1000000',
      transaction: { id: 'tx-1' },
    };
    await lastCall.getAmountData?.(request as never);

    expect(getMoneyAccountAmountDataMock).toHaveBeenCalledWith(
      expect.anything(),
      request,
    );
  });

  it('forwards getPaymentOverrideData to the money-account callback', async () => {
    TransactionPayControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TransactionPayController);
    const lastCall =
      controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
    getPaymentOverrideDataMock.mockResolvedValue({ calls: [] });

    const request = {
      amount: '10',
      transaction: { id: 'tx-1' },
      transactionData: {},
    };
    await lastCall.getPaymentOverrideData?.(request as never);

    expect(getPaymentOverrideDataMock).toHaveBeenCalledWith(
      request,
      expect.anything(),
    );
  });
});
