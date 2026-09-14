import { renderHook, act } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../context/confirm';
import { useMoneyAccountWithdrawableFiat } from '../../../../../hooks/money/useMoneyAccountWithdrawableFiat';
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
jest.mock('../../../../../hooks/money/useMoneyAccountWithdrawableFiat', () => ({
  useMoneyAccountWithdrawableFiat: jest.fn(),
}));
jest.mock('../../../utils/transaction-pay', () => ({
  applyMoneyAccountOverride: jest.fn(),
}));

const MONEY_ACCOUNT_ADDRESS = '0xc4ff9e84b5754570812d891ade0bad3952bb5946';

function mockSelectors({
  primaryMoneyAccount = { address: MONEY_ACCOUNT_ADDRESS },
  isEnabled = true,
  paymentOverride = undefined as PaymentOverride | undefined,
}: {
  primaryMoneyAccount?: { address: string } | null;
  isEnabled?: boolean;
  paymentOverride?: PaymentOverride | undefined;
} = {}) {
  let callIndex = 0;
  const sequence = [primaryMoneyAccount, isEnabled, paymentOverride];
  jest.mocked(useSelector).mockImplementation(() => {
    const value = sequence[callIndex % sequence.length];
    callIndex += 1;
    return value;
  });
}

describe('usePayWithMoneyAccountSection', () => {
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useCachedBalanceMock = jest.mocked(useMoneyAccountWithdrawableFiat);
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
    useCachedBalanceMock.mockReturnValue({
      withdrawableFiatRaw: undefined,
      withdrawableFiatFormatted: '$12.34',
    });
    mockSelectors();
  });

  it('returns null when money account transactions are disabled', () => {
    mockSelectors({ isEnabled: false });

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toBeNull();
  });

  it('returns null when there is no money account', () => {
    mockSelectors({ primaryMoneyAccount: null });

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
          subtitle: '$12.34 available',
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
          isSelected: false,
        }),
      ],
    });
  });

  it('returns a money account section for perpsWithdraw when enabled', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-withdraw-1',
        type: TransactionType.perpsWithdraw,
      },
    } as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toMatchObject({
      id: 'money-account',
      rows: [
        expect.objectContaining({
          title: 'Money account',
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
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
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the row selected when paymentOverride is MoneyAccount', () => {
    mockSelectors({ paymentOverride: PaymentOverride.MoneyAccount });

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current?.rows[0].isSelected).toBe(true);
    expect(result.current?.rows[0].trailingElement).toBe('checkmark');
  });
});
