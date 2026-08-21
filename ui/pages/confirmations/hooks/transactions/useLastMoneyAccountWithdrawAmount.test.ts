import { renderHook, act } from '@testing-library/react';
import {
  getLastMoneyAccountWithdrawAmount,
  setLastMoneyAccountWithdrawAmount,
  updateMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useLastMoneyAccountWithdrawAmount } from './useLastMoneyAccountWithdrawAmount';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(() => Promise.resolve(false)),
}));

describe('useLastMoneyAccountWithdrawAmount', () => {
  it('returns undefined before an amount is dispatched', () => {
    const { result } = renderHook(() =>
      useLastMoneyAccountWithdrawAmount('tx-none'),
    );

    expect(result.current).toBeUndefined();
    expect(getLastMoneyAccountWithdrawAmount('tx-none')).toBeUndefined();
  });

  it('updates when the typed amount is recorded', () => {
    const { result } = renderHook(() =>
      useLastMoneyAccountWithdrawAmount('tx-typed-amount'),
    );

    act(() => {
      setLastMoneyAccountWithdrawAmount('tx-typed-amount', '0.05');
    });

    expect(result.current).toBe('0.05');
  });

  it('updates when a withdraw amount is dispatched', async () => {
    const { result } = renderHook(() =>
      useLastMoneyAccountWithdrawAmount('tx-withdraw-amount'),
    );

    await act(async () => {
      await updateMoneyAccountWithdrawAmount('tx-withdraw-amount', '0.05');
    });

    expect(result.current).toBe('0.05');
  });
});
