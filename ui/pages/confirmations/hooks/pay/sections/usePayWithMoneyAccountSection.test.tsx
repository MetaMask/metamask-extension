import { renderHook, act } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../context/confirm';
import { applyMoneyAccountOverride } from '../../../utils/transaction-pay';
import {
  PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
  usePayWithMoneyAccountSection,
} from './usePayWithMoneyAccountSection';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const messages: Record<string, string> = {
      payWithMoneyAccount: 'Money account',
      available: 'available',
    };
    return messages[key] ?? key;
  },
}));
jest.mock('../../../utils/transaction-pay', () => ({
  applyMoneyAccountOverride: jest.fn(),
}));

describe('usePayWithMoneyAccountSection', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const applyMoneyAccountOverrideMock = jest.mocked(applyMoneyAccountOverride);
  const onClose = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
      },
    } as ReturnType<typeof useConfirmContext>);

    // First selector call is isEnabled; second is paymentOverride.
    let call = 0;
    useSelectorMock.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return true;
      }
      return undefined;
    });
  });

  it('returns null when money account transactions are disabled', () => {
    useSelectorMock.mockImplementation(() => false);

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toBeNull();
  });

  it('returns a money account section when enabled', () => {
    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toMatchObject({
      id: 'money-account',
      rows: [
        expect.objectContaining({
          title: 'Money account',
          subtitle: '$7.05 available',
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
          isSelected: false,
        }),
      ],
    });
  });

  it('applies the money account override and closes on press', () => {
    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    act(() => {
      result.current?.rows[0].onPress?.();
    });

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      'tx-1',
      undefined,
      expect.objectContaining({
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the row selected when paymentOverride is MoneyAccount', () => {
    let call = 0;
    useSelectorMock.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return true;
      }
      return PaymentOverride.MoneyAccount;
    });

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current?.rows[0].isSelected).toBe(true);
    expect(result.current?.rows[0].trailingElement).toBe('checkmark');
  });
});
