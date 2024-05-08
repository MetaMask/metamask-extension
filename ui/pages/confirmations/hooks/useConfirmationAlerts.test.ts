import { renderHook } from '@testing-library/react-hooks';
import usePersonalSignAlerts from './alerts/usePersonalSignAlerts';
import useConfirmationAlerts from './useConfirmationAlerts';

jest.mock('./alerts/usePersonalSignAlerts', () => jest.fn());

describe('useConfirmationAlerts', () => {
  describe('usePersonalSignAlerts', () => {
    it('returns an array of alerts', () => {
      const personalSignAlerts = [
        { key: '1', message: 'Alert 1' },
        { key: '2', message: 'Alert 2' },
      ];
      (usePersonalSignAlerts as jest.Mock).mockReturnValue(personalSignAlerts);

      const { result } = renderHook(() => useConfirmationAlerts());

      expect(result.current).toEqual(personalSignAlerts);
    });

    it('returns an empty array when there are no alerts', () => {
      (usePersonalSignAlerts as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() => useConfirmationAlerts());

      expect(result.current).toEqual([]);
    });
  });
});
