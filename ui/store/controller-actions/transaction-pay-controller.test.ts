import { PaymentOverride } from '@metamask/transaction-pay-controller';
import * as BackgroundConnectionModule from '../background-connection';
import {
  updateTransactionPaymentToken,
  setIsMaxAmount,
  setPostQuote,
  setAccountOverride,
  setPaymentOverride,
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
        [transactionId, true],
      );
    });

    it('calls submitRequestToBackground with transactionId and false', async () => {
      const transactionId = 'tx-789';

      await setIsMaxAmount(transactionId, false);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayIsMaxAmount',
        [transactionId, false],
      );
    });

    it('returns the result from submitRequestToBackground', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      const result = await setIsMaxAmount('tx-123', true);

      expect(result).toBeUndefined();
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
});
