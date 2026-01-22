import * as BackgroundConnectionModule from '../background-connection';
import {
  updateTransactionPaymentToken,
  setIsMaxAmount,
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
});
