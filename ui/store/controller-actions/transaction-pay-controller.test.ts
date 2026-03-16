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
    it('calls submitRequestToBackground with transactionId and callback that sets isMaxAmount to true', async () => {
      const transactionId = 'tx-456';

      await setIsMaxAmount(transactionId, true);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayConfig',
        [transactionId, expect.any(Function)],
      );

      const callback = mockSubmitRequestToBackground.mock.calls[0][1][1];
      const config: { isMaxAmount?: boolean } = {};
      callback(config);
      expect(config.isMaxAmount).toBe(true);
    });

    it('calls submitRequestToBackground with transactionId and callback that sets isMaxAmount to false', async () => {
      const transactionId = 'tx-789';

      await setIsMaxAmount(transactionId, false);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'setTransactionPayConfig',
        [transactionId, expect.any(Function)],
      );

      const callback = mockSubmitRequestToBackground.mock.calls[0][1][1];
      const config: { isMaxAmount?: boolean } = {};
      callback(config);
      expect(config.isMaxAmount).toBe(false);
    });

    it('returns the result from submitRequestToBackground', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      const result = await setIsMaxAmount('tx-123', true);

      expect(result).toBeUndefined();
    });
  });
});
