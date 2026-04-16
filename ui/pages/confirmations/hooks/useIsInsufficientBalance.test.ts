import { renderHook } from '@testing-library/react-hooks';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { useIsInsufficientBalance } from './useIsInsufficientBalance';
import * as alertsModule from './alerts/transactions/useInsufficientBalanceAlerts';

describe('useIsInsufficientBalance', () => {
  it('returns true when there are insufficient balance alerts', () => {
    jest
      .spyOn(alertsModule, 'useInsufficientBalanceAlerts')
      .mockReturnValue([{ reason: 'mocked alert' } as Alert]);

    const { result } = renderHook(() => useIsInsufficientBalance());

    expect(result.current).toBe(true);
  });

  it('returns false when there are no insufficient balance alerts', () => {
    jest
      .spyOn(alertsModule, 'useInsufficientBalanceAlerts')
      .mockReturnValue([]);

    const { result } = renderHook(() => useIsInsufficientBalance());

    expect(result.current).toBe(false);
  });
});
