import { renderHook } from '@testing-library/react-hooks';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';
import useConfirmationAlerts from './useConfirmationAlerts';

jest.mock('./alerts/useBlockaidAlerts', () => jest.fn());

jest.mock('./alerts/transactions/useGasEstimateFailedAlerts', () => ({
  useGasEstimateFailedAlerts: () => [],
}));

jest.mock('./alerts/transactions/useGasFeeLowAlerts', () => ({
  useGasFeeLowAlerts: () => [],
}));

jest.mock('./alerts/transactions/useGasTooLowAlerts', () => ({
  useGasTooLowAlerts: () => [],
}));

jest.mock('./alerts/transactions/useInsufficientBalanceAlerts', () => ({
  useInsufficientBalanceAlerts: () => [],
}));

jest.mock('./alerts/transactions/useNoGasPriceAlerts', () => ({
  useNoGasPriceAlerts: () => [],
}));

jest.mock('./alerts/transactions/usePaymasterAlerts', () => ({
  usePaymasterAlerts: () => [],
}));

jest.mock('./alerts/transactions/usePendingTransactionAlerts', () => ({
  usePendingTransactionAlerts: () => [],
}));

jest.mock('./alerts/transactions/useSigningOrSubmittingAlerts', () => ({
  useSigningOrSubmittingAlerts: () => [],
}));

describe('useConfirmationAlerts', () => {
  describe('useBlockaidAlerts', () => {
    it('returns an array of alerts', () => {
      const personalSignAlerts = [
        { key: '1', message: 'Alert 1' },
        { key: '2', message: 'Alert 2' },
      ];
      (useBlockaidAlerts as jest.Mock).mockReturnValue(personalSignAlerts);

      const { result } = renderHook(() => useConfirmationAlerts());

      expect(result.current).toEqual(personalSignAlerts);
    });

    it('returns an empty array when there are no alerts', () => {
      (useBlockaidAlerts as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() => useConfirmationAlerts());

      expect(result.current).toEqual([]);
    });
  });
});
