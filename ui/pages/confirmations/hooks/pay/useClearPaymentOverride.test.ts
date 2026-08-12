import { renderHook, act } from '@testing-library/react';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../context/confirm';
import { clearPaymentOverride } from '../../utils/transaction-pay';
import { useClearPaymentOverride } from './useClearPaymentOverride';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../../utils/transaction-pay', () => ({
  clearPaymentOverride: jest.fn(),
}));

describe('useClearPaymentOverride', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const clearPaymentOverrideMock = jest.mocked(clearPaymentOverride);

  beforeEach(() => {
    jest.resetAllMocks();
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: { id: 'tx-1' },
    } as ReturnType<typeof useConfirmContext>);
  });

  it('clears the payment override when one is set', () => {
    useSelectorMock.mockReturnValue(PaymentOverride.MoneyAccount);

    const { result } = renderHook(() => useClearPaymentOverride());

    act(() => {
      result.current();
    });

    expect(clearPaymentOverrideMock).toHaveBeenCalledWith('tx-1');
  });

  it('does not clear when no payment override is set', () => {
    useSelectorMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useClearPaymentOverride());

    act(() => {
      result.current();
    });

    expect(clearPaymentOverrideMock).not.toHaveBeenCalled();
  });

  it('does not clear when the confirmation has no id', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {},
    } as ReturnType<typeof useConfirmContext>);
    useSelectorMock.mockReturnValue(PaymentOverride.MoneyAccount);

    const { result } = renderHook(() => useClearPaymentOverride());

    act(() => {
      result.current();
    });

    expect(clearPaymentOverrideMock).not.toHaveBeenCalled();
  });
});
