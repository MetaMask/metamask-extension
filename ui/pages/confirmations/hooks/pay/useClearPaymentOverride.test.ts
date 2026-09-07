import { renderHook, act } from '@testing-library/react';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import {
  selectPaymentOverrideByTransactionId,
  selectTransactionPayIsMaxAmountByTransactionId,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { clearPaymentOverride } from '../../utils/transaction-pay';
import { useClearPaymentOverride } from './useClearPaymentOverride';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectPaymentOverrideByTransactionId: jest.fn(),
  selectTransactionPayIsMaxAmountByTransactionId: jest.fn(),
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

  function mockSelectors({
    paymentOverride,
    isMaxAmount = false,
  }: {
    paymentOverride?: PaymentOverride;
    isMaxAmount?: boolean;
  }) {
    jest
      .mocked(selectPaymentOverrideByTransactionId)
      .mockReturnValue(paymentOverride);
    jest
      .mocked(selectTransactionPayIsMaxAmountByTransactionId)
      .mockReturnValue(isMaxAmount);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    useSelectorMock.mockImplementation((selector) => selector({} as never));
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: { id: 'tx-1' },
    } as ReturnType<typeof useConfirmContext>);
  });

  it('clears the payment override when one is set', () => {
    mockSelectors({ paymentOverride: PaymentOverride.MoneyAccount });

    const { result } = renderHook(() => useClearPaymentOverride());

    act(() => {
      result.current();
    });

    expect(clearPaymentOverrideMock).toHaveBeenCalledWith('tx-1', undefined);
  });

  it('keeps a max-amount money-account deposit non-atomic', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-1',
        type: TransactionType.moneyAccountDeposit,
      },
    } as ReturnType<typeof useConfirmContext>);
    mockSelectors({
      paymentOverride: PaymentOverride.MoneyAccount,
      isMaxAmount: true,
    });

    const { result } = renderHook(() => useClearPaymentOverride());

    act(() => {
      result.current();
    });

    expect(clearPaymentOverrideMock).toHaveBeenCalledWith('tx-1', false);
  });

  it('does not clear when no payment override is set', () => {
    mockSelectors({ paymentOverride: undefined });

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
    mockSelectors({ paymentOverride: PaymentOverride.MoneyAccount });

    const { result } = renderHook(() => useClearPaymentOverride());

    act(() => {
      result.current();
    });

    expect(clearPaymentOverrideMock).not.toHaveBeenCalled();
  });
});
