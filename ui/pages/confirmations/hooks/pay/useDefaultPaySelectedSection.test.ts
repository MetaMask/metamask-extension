import { TransactionType } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../useConfirmationNavigation';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';
import { useDefaultPaySelectedSection } from './useDefaultPaySelectedSection';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('./useIsMoneyAccountFlagDefault', () => ({
  useIsMoneyAccountFlagDefault: jest.fn(),
}));
jest.mock('../useConfirmationNavigation', () => ({
  PayWithOption: { MoneyAccount: 'money_account' },
  useConfirmationNavigationOptions: jest.fn(),
}));
jest.mock('../../utils/transaction-pay', () => ({
  applyMoneyAccountOverride: jest.fn(),
}));

const TRANSACTION_ID = 'tx-perps-1';
const MONEY_ACCOUNT_ADDRESS = '0xc4ff9e84b5754570812d891ade0bad3952bb5946';

describe('useDefaultPaySelectedSection', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );
  const useIsMoneyAccountFlagDefaultMock = jest.mocked(
    useIsMoneyAccountFlagDefault,
  );
  const useConfirmationNavigationOptionsMock = jest.mocked(
    useConfirmationNavigationOptions,
  );
  const applyMoneyAccountOverrideMock = jest.mocked(applyMoneyAccountOverride);

  function mockConfirmation(
    type: TransactionType = TransactionType.perpsWithdraw,
  ) {
    useTransactionMetadataRequestOptionalMock.mockReturnValue({
      id: TRANSACTION_ID,
      type,
    } as never);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(false);
    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: undefined,
    } as ReturnType<typeof useConfirmationNavigationOptions>);
    useSelectorMock.mockImplementation((selector: unknown) => {
      if (selector === selectPrimaryMoneyAccount) {
        return { address: MONEY_ACCOUNT_ADDRESS };
      }
      return undefined;
    });
    mockConfirmation();
  });

  it('does nothing when the flag default is inactive and payWithOption is unset', () => {
    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does nothing when there is no confirmation', () => {
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);
    useTransactionMetadataRequestOptionalMock.mockReturnValue(undefined);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('applies the Money Account override for perpsWithdraw', () => {
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({
        id: TRANSACTION_ID,
        type: TransactionType.perpsWithdraw,
      }),
    );
  });

  it('applies the override for perpsDeposit', () => {
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);
    mockConfirmation(TransactionType.perpsDeposit);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({
        type: TransactionType.perpsDeposit,
      }),
    );
  });

  it('applies the override for predictWithdraw', () => {
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);
    mockConfirmation(TransactionType.predictWithdraw);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({
        type: TransactionType.predictWithdraw,
      }),
    );
  });

  it('applies the money account override when payWithOption is MoneyAccount', () => {
    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: PayWithOption.MoneyAccount,
    } as ReturnType<typeof useConfirmationNavigationOptions>);
    mockConfirmation(TransactionType.perpsDeposit);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({
        id: TRANSACTION_ID,
        type: TransactionType.perpsDeposit,
      }),
    );
  });

  it('does not apply the money account override via payWithOption for non-deposit transactions', () => {
    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: PayWithOption.MoneyAccount,
    } as ReturnType<typeof useConfirmationNavigationOptions>);
    mockConfirmation(TransactionType.simpleSend);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('omits the money account address when none exists', () => {
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);
    useSelectorMock.mockImplementation(() => undefined);

    renderHook(() => useDefaultPaySelectedSection());

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      undefined,
      expect.objectContaining({ id: TRANSACTION_ID }),
    );
  });

  it('only applies the override once per transaction', () => {
    useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);

    const { rerender } = renderHook(() => useDefaultPaySelectedSection());
    rerender();

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledTimes(1);
  });
});
