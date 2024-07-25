import { renderHook } from '@testing-library/react-hooks';
import useQueuedConfirmationsAlerts from './alerts/transactions/useQueuedConfirmationsAlerts';
import useBlockaidAlert from './alerts/useBlockaidAlert';
import useConfirmationAlerts from './useConfirmationAlerts';

jest.mock('./alerts/useBlockaidAlert', () => jest.fn());
jest.mock('./alerts/transactions/useQueuedConfirmationsAlerts', () =>
  jest.fn(),
);

describe('useConfirmationAlerts', () => {
  describe('useBlockaidAlert', () => {
    it('returns an array of alerts', () => {
      const personalSignAlerts = [
        { key: '1', message: 'Alert 1' },
        { key: '2', message: 'Alert 2' },
      ];
      (useBlockaidAlert as jest.Mock).mockReturnValue(personalSignAlerts);
      (useQueuedConfirmationsAlerts as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() => useConfirmationAlerts());

      expect(result.current).toEqual(personalSignAlerts);
    });

    it('returns an empty array when there are no alerts', () => {
      (useBlockaidAlert as jest.Mock).mockReturnValue([]);
      (useQueuedConfirmationsAlerts as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() => useConfirmationAlerts());

      expect(result.current).toEqual([]);
    });
  });
});
