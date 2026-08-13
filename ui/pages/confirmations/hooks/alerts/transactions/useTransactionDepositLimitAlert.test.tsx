import { renderHook } from '@testing-library/react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { ConfirmContext } from '../../../context/confirm';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { useTransactionDepositLimitAlert } from './useTransactionDepositLimitAlert';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../pay/useTransactionPayData', () => ({
  ...jest.requireActual('../../pay/useTransactionPayData'),
  useTransactionPayPrimaryRequiredToken: jest.fn(),
}));
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) =>
    args?.length ? `${key}:${args.join(',')}` : key,
}));

function renderHookWithConfirmation(
  confirmation: Partial<TransactionMeta> | undefined,
  pendingAmount?: string,
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

  return renderHook(() => useTransactionDepositLimitAlert({ pendingAmount }), {
    wrapper,
  });
}

describe('useTransactionDepositLimitAlert', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useTransactionPayPrimaryRequiredTokenMock = jest.mocked(
    useTransactionPayPrimaryRequiredToken,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useSelectorMock.mockReturnValue({
      moneyAccountDeposit: 100000,
    });
    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue(undefined);
  });

  it('returns alert when pending amount exceeds deposit limit', () => {
    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.moneyAccountDeposit,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '150000',
    );

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.DepositLimit,
        field: RowAlertKey.Amount,
        reason: 'alertDepositLimit:$100,000',
        message: 'alertDepositLimit:$100,000',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns no alert when pending amount equals deposit limit', () => {
    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.moneyAccountDeposit,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '100000',
    );

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when pending amount is less than deposit limit', () => {
    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.moneyAccountDeposit,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '50000',
    );

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when deposit limits map is empty', () => {
    useSelectorMock.mockReturnValue({});

    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.moneyAccountDeposit,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '150000',
    );

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when transaction type has no configured deposit limit', () => {
    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.simpleSend,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '150000',
    );

    expect(result.current).toStrictEqual([]);
  });

  it('uses amountFiat from the primary required token when pendingAmount is omitted', () => {
    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue({
      amountFiat: '150000',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    const { result } = renderHookWithConfirmation({
      type: TransactionType.moneyAccountDeposit,
      txParams: { from: '0xabc' },
    } as TransactionMeta);

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe(AlertsName.DepositLimit);
  });

  it('uses custom limit from feature flag', () => {
    useSelectorMock.mockReturnValue({
      moneyAccountDeposit: 50000,
    });

    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.moneyAccountDeposit,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '60000',
    );

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.DepositLimit,
        field: RowAlertKey.Amount,
        reason: 'alertDepositLimit:$50,000',
        message: 'alertDepositLimit:$50,000',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('matches any deposit type from the feature flag map', () => {
    useSelectorMock.mockReturnValue({
      moneyAccountDeposit: 100000,
      perpsDeposit: 25000,
    });

    const { result } = renderHookWithConfirmation(
      {
        type: TransactionType.perpsDeposit,
        txParams: { from: '0xabc' },
      } as TransactionMeta,
      '30000',
    );

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.DepositLimit,
        field: RowAlertKey.Amount,
        reason: 'alertDepositLimit:$25,000',
        message: 'alertDepositLimit:$25,000',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });
});
