import { PaymentOverride } from '@metamask/transaction-pay-controller';
import * as BackgroundConnectionModule from '../background-connection';
import {
  updateTransactionPaymentToken,
  setIsMaxAmount,
  setPostQuote,
  setAccountOverride,
  setPaymentOverride,
  createMoneyAccountDepositTransaction,
  createMoneyAccountWithdrawTransaction,
  updateMoneyAccountDepositAmount,
  updateMoneyAccountWithdrawAmount,
  getLastMoneyAccountWithdrawAmount,
} from './transaction-pay-controller';

jest.mock('../background-connection');

describe('transaction-pay-controller actions', () => {
  const mockSubmitRequestToBackground = jest.spyOn(
    BackgroundConnectionModule,
    'submitRequestToBackground',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  describe('updateTransactionPaymentToken', () => {
    it('calls submitRequestToBackground with correct parameters', async () => {
      const params = {
        transactionId: 'tx-123',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678' as const,
        chainId: '0x1' as const,
      };

      await updateTransactionPaymentToken(params);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateTransactionPaymentToken',
        [params],
      );
    });

    it('returns the result from submitRequestToBackground', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      const result = await updateTransactionPaymentToken({
        transactionId: 'tx-123',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678' as const,
        chainId: '0x1' as const,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('setIsMaxAmount', () => {
    it('calls submitRequestToBackground with transactionId and true', async () => {
      const transactionId = 'tx-456';

      await setIsMaxAmount(transactionId, true);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayIsMaxAmount',
        [transactionId, true, {}],
      );
    });

    it('calls submitRequestToBackground with transactionId and false', async () => {
      const transactionId = 'tx-789';

      await setIsMaxAmount(transactionId, false);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayIsMaxAmount',
        [transactionId, false, {}],
      );
    });

    it('forwards isMoneyAccountDeposit so Max deposits run non-atomic', async () => {
      await setIsMaxAmount('tx-ma', true, { isMoneyAccountDeposit: true });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayIsMaxAmount',
        ['tx-ma', true, { isMoneyAccountDeposit: true }],
      );
    });
  });

  describe('setPostQuote', () => {
    it('forwards transactionId and options to submitRequestToBackground', async () => {
      await setPostQuote('tx-99', { isHyperliquidSource: true });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayPostQuote',
        ['tx-99', { isHyperliquidSource: true }],
      );
    });

    it('defaults options to an empty object when omitted', async () => {
      await setPostQuote('tx-100');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayPostQuote',
        ['tx-100', {}],
      );
    });
  });

  describe('setAccountOverride', () => {
    it('calls submitRequestToBackground with setTransactionPayAccountOverride', async () => {
      const transactionId = 'tx-override';
      const accountOverride =
        '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      await setAccountOverride(transactionId, accountOverride);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayAccountOverride',
        [transactionId, accountOverride],
      );
    });
  });

  describe('createMoneyAccountDepositTransaction', () => {
    it('forwards the batch id and selected-account override', async () => {
      const batchId = '0xb47c41d0000000000000000000000000' as const;
      const accountOverride =
        '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      mockSubmitRequestToBackground.mockResolvedValue({
        transactionId: 'tx-deposit',
        batchId,
      });

      await createMoneyAccountDepositTransaction(batchId, accountOverride);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'createMoneyAccountDepositTransaction',
        [batchId, accountOverride],
      );
    });
  });

  describe('createMoneyAccountWithdrawTransaction', () => {
    it('forwards the selected-account override', async () => {
      const accountOverride =
        '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      mockSubmitRequestToBackground.mockResolvedValue({
        transactionId: 'tx-withdraw',
        batchId: '0x1234',
      });

      await createMoneyAccountWithdrawTransaction(accountOverride);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'createMoneyAccountWithdrawTransaction',
        [accountOverride],
      );
    });
  });

  describe('updateMoneyAccountDepositAmount', () => {
    it('forwards the transaction id and human amount', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(true);

      const result = await updateMoneyAccountDepositAmount('tx-deposit', '10');

      expect(result).toBe(true);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateMoneyAccountDepositAmount',
        ['tx-deposit', '10'],
      );
    });
  });

  describe('setPaymentOverride', () => {
    it('calls submitRequestToBackground with setTransactionPayPaymentOverride', async () => {
      const transactionId = 'tx-pay-override';
      const refundTo = '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      await setPaymentOverride(transactionId, {
        paymentOverride: PaymentOverride.MoneyAccount,
        refundTo,
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayPaymentOverride',
        [
          transactionId,
          {
            paymentOverride: PaymentOverride.MoneyAccount,
            refundTo,
          },
        ],
      );
    });

    it('defaults options to an empty object when omitted', async () => {
      await setPaymentOverride('tx-clear');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayPaymentOverride',
        ['tx-clear', { paymentOverride: undefined, refundTo: undefined }],
      );
    });
  });

  describe('updateMoneyAccountWithdrawAmount', () => {
    it('forwards transactionId, amount, and recipient override', async () => {
      const transactionId = 'tx-withdraw';
      const recipientOverride =
        '0xabcdef1234567890abcdef1234567890abcdef12' as const;

      await updateMoneyAccountWithdrawAmount(
        transactionId,
        '0.05',
        recipientOverride,
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateMoneyAccountWithdrawAmount',
        [transactionId, '0.05', recipientOverride],
      );
    });

    it('records the last withdraw amount for confirm to re-encode', async () => {
      const transactionId = 'tx-withdraw-last-amount';
      mockSubmitRequestToBackground.mockResolvedValue({ id: transactionId });

      await updateMoneyAccountWithdrawAmount(transactionId, '1.25');

      expect(getLastMoneyAccountWithdrawAmount(transactionId)).toBe('1.25');
    });
  });
});
