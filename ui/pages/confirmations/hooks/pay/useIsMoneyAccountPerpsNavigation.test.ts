import { TransactionType } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../useConfirmationNavigation';
import { useIsMoneyAccountPerpsNavigation } from './useIsMoneyAccountPerpsNavigation';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('../useConfirmationNavigation', () => ({
  PayWithOption: { MoneyAccount: 'money_account' },
  useConfirmationNavigationOptions: jest.fn(),
}));

describe('useIsMoneyAccountPerpsNavigation', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );
  const useConfirmationNavigationOptionsMock = jest.mocked(
    useConfirmationNavigationOptions,
  );

  // `null` means "absent" — a plain `undefined` would fall back to the default.
  function mockHook({
    isMoneyAccountPayEnabled = true,
    payWithOption = PayWithOption.MoneyAccount as PayWithOption | null,
    type = TransactionType.perpsDeposit as TransactionType | null,
  } = {}) {
    useSelectorMock.mockReturnValue(isMoneyAccountPayEnabled);
    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: payWithOption ?? undefined,
    } as ReturnType<typeof useConfirmationNavigationOptions>);
    useTransactionMetadataRequestOptionalMock.mockReturnValue(
      type ? ({ id: 'tx-1', type } as never) : undefined,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns true for a flag-enabled Money Account perps deposit', () => {
    mockHook();

    const { result } = renderHook(() => useIsMoneyAccountPerpsNavigation());
    expect(result.current).toBe(true);
  });

  it('returns false when Money Account pay is disabled for perps deposit', () => {
    mockHook({ isMoneyAccountPayEnabled: false });

    const { result } = renderHook(() => useIsMoneyAccountPerpsNavigation());
    expect(result.current).toBe(false);
  });

  it('returns false when the confirmation was not opened with the Money Account option', () => {
    mockHook({ payWithOption: null });

    const { result } = renderHook(() => useIsMoneyAccountPerpsNavigation());
    expect(result.current).toBe(false);
  });

  it('returns false for a non-perps-deposit confirmation', () => {
    mockHook({ type: TransactionType.simpleSend });

    const { result } = renderHook(() => useIsMoneyAccountPerpsNavigation());
    expect(result.current).toBe(false);
  });

  it('returns false when there is no confirmation', () => {
    mockHook({ type: null });

    const { result } = renderHook(() => useIsMoneyAccountPerpsNavigation());
    expect(result.current).toBe(false);
  });
});
