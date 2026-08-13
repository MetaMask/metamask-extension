import { act, renderHook } from '@testing-library/react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import React from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { ConfirmContext } from '../../../context/confirm';
import { ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS } from '../../pay/useAutomaticTransactionPayToken';
import { useTransactionPayAvailableTokens } from '../../pay/useTransactionPayAvailableTokens';
import { useIsTransactionPayLoading } from '../../pay/useTransactionPayData';
import { useTransactionAccountOverride } from '../../transactions/useTransactionAccountOverride';
import { AlertsName } from '../constants';
import { useAccountNoFundsAlert } from './useAccountNoFundsAlert';

jest.mock('../../pay/useTransactionPayAvailableTokens');
jest.mock('../../pay/useTransactionPayData', () => ({
  ...jest.requireActual('../../pay/useTransactionPayData'),
  useIsTransactionPayLoading: jest.fn(),
}));
jest.mock('../../transactions/useTransactionAccountOverride');
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

function renderHookWithConfirmation(
  confirmation: Partial<TransactionMeta> | undefined,
) {
  const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <ConfirmContext.Provider
      value={
        {
          currentConfirmation: confirmation,
          isScrollToBottomCompleted: true,
          setIsScrollToBottomCompleted: jest.fn(),
        } as never
      }
    >
      {children}
    </ConfirmContext.Provider>
  );

  return renderHook(() => useAccountNoFundsAlert(), { wrapper });
}

describe('useAccountNoFundsAlert', () => {
  const useTransactionPayAvailableTokensMock = jest.mocked(
    useTransactionPayAvailableTokens,
  );
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const useTransactionAccountOverrideMock = jest.mocked(
    useTransactionAccountOverride,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();

    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: false },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);
    useIsTransactionPayLoadingMock.mockReturnValue(false);
    useTransactionAccountOverrideMock.mockReturnValue(undefined);
  });

  it('returns alert for moneyAccountDeposit with no available tokens', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([]);

    const { result } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.AccountNoFunds,
        field: RowAlertKey.PayWith,
        reason: 'alertAccountNoFundsTitle',
        message: 'alertAccountNoFundsMessage',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns alert when every available token is disabled', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: true },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);

    const { result } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe(AlertsName.AccountNoFunds);
  });

  it('returns no alert for moneyAccountDeposit with available tokens', () => {
    const { result } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert for non-moneyAccountDeposit transaction', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([]);

    const { result } = renderHookWithConfirmation({
      type: TransactionType.perpsDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when confirmation is undefined', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([]);

    const { result } = renderHookWithConfirmation(undefined);

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when transaction pay is still loading', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([]);
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { result } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toStrictEqual([]);
  });

  it('does not flash alert while funding tokens load after account override', () => {
    jest.useFakeTimers();
    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: false },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);

    const { result, rerender } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toStrictEqual([]);

    useTransactionAccountOverrideMock.mockReturnValue(
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex,
    );
    useTransactionPayAvailableTokensMock.mockReturnValue([]);
    rerender();

    expect(result.current).toStrictEqual([]);

    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: false },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);
    rerender();

    expect(result.current).toStrictEqual([]);
  });

  it('returns alert after account-reselect empty timeout when tokens stay empty', () => {
    jest.useFakeTimers();
    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: false },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);

    const { result, rerender } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    useTransactionAccountOverrideMock.mockReturnValue(
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex,
    );
    useTransactionPayAvailableTokensMock.mockReturnValue([]);
    rerender();

    expect(result.current).toStrictEqual([]);

    act(() => {
      jest.advanceTimersByTime(ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS);
    });

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.AccountNoFunds,
        field: RowAlertKey.PayWith,
        reason: 'alertAccountNoFundsTitle',
        message: 'alertAccountNoFundsMessage',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('resets the empty-account wait when switching between empty accounts', () => {
    jest.useFakeTimers();
    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: false },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);

    const { result, rerender } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    useTransactionAccountOverrideMock.mockReturnValue(
      '0x1111111111111111111111111111111111111111' as Hex,
    );
    useTransactionPayAvailableTokensMock.mockReturnValue([]);
    rerender();

    act(() => {
      jest.advanceTimersByTime(ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS - 1);
    });
    expect(result.current).toStrictEqual([]);

    useTransactionAccountOverrideMock.mockReturnValue(
      '0x2222222222222222222222222222222222222222' as Hex,
    );
    rerender();

    act(() => {
      jest.advanceTimersByTime(ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS - 1);
    });
    expect(result.current).toStrictEqual([]);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe(AlertsName.AccountNoFunds);
  });
});
