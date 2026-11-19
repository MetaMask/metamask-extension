import { TransactionType } from '@metamask/transaction-controller';
import { renderHook, waitFor } from '@testing-library/react';
import { MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { selectMoneyAccountVaultConfig } from '../../../../selectors/money/money-account-feature-flags';
import { updateTransactionPaymentToken } from '../../../../store/controller-actions/transaction-pay-controller';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';
import { useIsMoneyAccountPerpsNavigation } from './useIsMoneyAccountPerpsNavigation';
import { useDefaultPaySelectedSection } from './useDefaultPaySelectedSection';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('./useIsMoneyAccountFlagDefault', () => ({
  useIsMoneyAccountFlagDefault: jest.fn(),
}));
jest.mock('./useIsMoneyAccountPerpsNavigation', () => ({
  useIsMoneyAccountPerpsNavigation: jest.fn(),
}));
jest.mock('../../utils/transaction-pay', () => ({
  applyMoneyAccountOverride: jest.fn(),
}));
jest.mock(
  '../../../../store/controller-actions/transaction-pay-controller',
  () => ({
    updateTransactionPaymentToken: jest.fn(),
  }),
);

const TRANSACTION_ID = 'tx-perps-1';
const MONEY_ACCOUNT_ADDRESS = '0xc4ff9e84b5754570812d891ade0bad3952bb5946';
const VAULT_UNDERLYING_TOKEN = '0x1111111111111111111111111111111111111111';
const VAULT_CHAIN_ID = '0x8f';

describe('useDefaultPaySelectedSection', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );
  const useIsMoneyAccountFlagDefaultMock = jest.mocked(
    useIsMoneyAccountFlagDefault,
  );
  const useIsMoneyAccountPerpsNavigationMock = jest.mocked(
    useIsMoneyAccountPerpsNavigation,
  );
  const applyMoneyAccountOverrideMock = jest.mocked(applyMoneyAccountOverride);
  const updateTransactionPaymentTokenMock = jest.mocked(
    updateTransactionPaymentToken,
  );

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
    useIsMoneyAccountPerpsNavigationMock.mockReturnValue(false);
    useSelectorMock.mockImplementation((selector: unknown) => {
      if (selector === selectPrimaryMoneyAccount) {
        return { address: MONEY_ACCOUNT_ADDRESS };
      }
      if (selector === selectMoneyAccountVaultConfig) {
        return {
          underlyingToken: VAULT_UNDERLYING_TOKEN,
          chainId: VAULT_CHAIN_ID,
        };
      }
      return undefined;
    });
    updateTransactionPaymentTokenMock.mockResolvedValue(undefined);
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

  it('applies the money account override on a Money Account → Perps navigation', () => {
    useIsMoneyAccountPerpsNavigationMock.mockReturnValue(true);
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

  describe('Money Account pay token', () => {
    it('selects the vault token when the flag defaults to Money Account', () => {
      useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);

      renderHook(() => useDefaultPaySelectedSection());

      expect(updateTransactionPaymentTokenMock).toHaveBeenCalledTimes(1);
      expect(updateTransactionPaymentTokenMock).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        tokenAddress: VAULT_UNDERLYING_TOKEN,
        chainId: VAULT_CHAIN_ID,
      });
    });

    it('selects the token after applying the override', () => {
      useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);

      renderHook(() => useDefaultPaySelectedSection());

      expect(
        applyMoneyAccountOverrideMock.mock.invocationCallOrder[0],
      ).toBeLessThan(
        updateTransactionPaymentTokenMock.mock.invocationCallOrder[0],
      );
    });

    it('falls back to Monad mUSD without a vault config', () => {
      useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);
      useSelectorMock.mockImplementation((selector: unknown) =>
        selector === selectPrimaryMoneyAccount
          ? { address: MONEY_ACCOUNT_ADDRESS }
          : undefined,
      );

      renderHook(() => useDefaultPaySelectedSection());

      expect(updateTransactionPaymentTokenMock).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: CHAIN_IDS.MONAD,
      });
    });

    it('does not select a token on a Money Account → Perps navigation', () => {
      useIsMoneyAccountPerpsNavigationMock.mockReturnValue(true);
      mockConfirmation(TransactionType.perpsDeposit);

      renderHook(() => useDefaultPaySelectedSection());

      expect(applyMoneyAccountOverrideMock).toHaveBeenCalledTimes(1);
      expect(updateTransactionPaymentTokenMock).not.toHaveBeenCalled();
    });

    it('does not select a token when the flag default is inactive', () => {
      renderHook(() => useDefaultPaySelectedSection());

      expect(updateTransactionPaymentTokenMock).not.toHaveBeenCalled();
    });

    it('only selects the token once per transaction', () => {
      useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);

      const { rerender } = renderHook(() => useDefaultPaySelectedSection());
      rerender();

      expect(updateTransactionPaymentTokenMock).toHaveBeenCalledTimes(1);
    });

    it('logs an error when selecting the token fails', async () => {
      const error = new Error('Payment token not found');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      useIsMoneyAccountFlagDefaultMock.mockReturnValue(true);
      updateTransactionPaymentTokenMock.mockRejectedValue(error);

      renderHook(() => useDefaultPaySelectedSection());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to set the Money Account pay token',
          error,
        );
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
