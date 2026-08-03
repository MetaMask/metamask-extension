import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { ConfirmContext } from '../../../context/confirm';
import { useTransactionPayAvailableTokens } from '../../pay/useTransactionPayAvailableTokens';
import { useIsTransactionPayLoading } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { useAccountNoFundsAlert } from './useAccountNoFundsAlert';

jest.mock('../../pay/useTransactionPayAvailableTokens');
jest.mock('../../pay/useTransactionPayData', () => ({
  ...jest.requireActual('../../pay/useTransactionPayData'),
  useIsTransactionPayLoading: jest.fn(),
}));
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

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayAvailableTokensMock.mockReturnValue([
      { disabled: false },
    ] as ReturnType<typeof useTransactionPayAvailableTokens>);
    useIsTransactionPayLoadingMock.mockReturnValue(false);
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
});
