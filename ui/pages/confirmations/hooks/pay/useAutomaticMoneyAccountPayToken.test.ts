import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useMoneyAccountWithdrawableFiat } from '../../../../hooks/money/useMoneyAccountWithdrawableFiat';
import { useIsHardwareWalletAccount } from '../../../../hooks/useIsHardwareWalletAccount';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { selectPaymentOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import {
  selectIsMoneyAccountTransactionEnabled,
  selectMinimumRequiredTokenBalance,
  selectPreferredPayTokens,
} from '../../selectors/feature-flags';
import type { Asset } from '../../types/send';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';
import { useAutomaticMoneyAccountPayToken } from './useAutomaticMoneyAccountPayToken';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn((selector: (state: unknown) => unknown) => selector({})),
}));
jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../../../../hooks/money/useMoneyAccountWithdrawableFiat', () => ({
  useMoneyAccountWithdrawableFiat: jest.fn(),
}));
jest.mock('../../../../hooks/useIsHardwareWalletAccount', () => ({
  useIsHardwareWalletAccount: jest.fn(),
}));
jest.mock('../../../../selectors/money-account', () => ({
  selectPrimaryMoneyAccount: jest.fn(),
}));
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectPaymentOverrideByTransactionId: jest.fn(),
}));
jest.mock('../../selectors/feature-flags', () => ({
  selectIsMoneyAccountTransactionEnabled: jest.fn(),
  selectMinimumRequiredTokenBalance: jest.fn(),
  selectPreferredPayTokens: jest.fn(),
}));
jest.mock('../../utils/transaction-pay', () => ({
  applyMoneyAccountOverride: jest.fn(),
}));

const TRANSACTION_ID = 'tx-perps-deposit';
const FROM_ADDRESS = '0xdc47789de4ceff0e8fe9d15d728af7f17550c164';
const MONEY_ACCOUNT_ADDRESS = '0xabc1111111111111111111111111111111111111';
const TOKEN_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function runHook({
  availableTokens = [],
  disable = false,
  payTokenSelected = false,
}: {
  availableTokens?: Asset[];
  disable?: boolean;
  payTokenSelected?: boolean;
} = {}) {
  return renderHook(() =>
    useAutomaticMoneyAccountPayToken({
      availableTokens,
      disable,
      payTokenSelected,
    }),
  );
}

describe('useAutomaticMoneyAccountPayToken', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useMoneyAccountWithdrawableFiatMock = jest.mocked(
    useMoneyAccountWithdrawableFiat,
  );
  const useIsHardwareWalletAccountMock = jest.mocked(
    useIsHardwareWalletAccount,
  );
  const selectPrimaryMoneyAccountMock = jest.mocked(selectPrimaryMoneyAccount);
  const selectPaymentOverrideMock = jest.mocked(
    selectPaymentOverrideByTransactionId,
  );
  const selectPreferredPayTokensMock = jest.mocked(selectPreferredPayTokens);
  const selectMinimumRequiredTokenBalanceMock = jest.mocked(
    selectMinimumRequiredTokenBalance,
  );
  const selectIsMoneyAccountTransactionEnabledMock = jest.mocked(
    selectIsMoneyAccountTransactionEnabled,
  );
  const applyMoneyAccountOverrideMock = jest.mocked(applyMoneyAccountOverride);

  function mockConfirmation(
    type: TransactionType = TransactionType.perpsDeposit,
    nestedTransactions?: { type: TransactionType }[],
  ) {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: TRANSACTION_ID,
        type,
        nestedTransactions,
        txParams: { from: FROM_ADDRESS },
      },
    } as never);
  }

  function mockMoneyAccountPay({
    balance = '7.61',
    enabled = true,
    isLoading = false,
    type = TransactionType.perpsDeposit,
  }: {
    balance?: string;
    enabled?: boolean;
    isLoading?: boolean;
    type?: TransactionType;
  } = {}) {
    mockConfirmation(type);
    selectIsMoneyAccountTransactionEnabledMock.mockReturnValue(enabled);
    useMoneyAccountWithdrawableFiatMock.mockReturnValue({
      isLoading,
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: isLoading ? undefined : balance,
    });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    useSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) => selector({}),
    );
    useIsHardwareWalletAccountMock.mockReturnValue(false);
    selectPaymentOverrideMock.mockReturnValue(undefined);
    selectPrimaryMoneyAccountMock.mockReturnValue({
      address: MONEY_ACCOUNT_ADDRESS,
    } as never);
    selectPreferredPayTokensMock.mockReturnValue([]);
    selectMinimumRequiredTokenBalanceMock.mockReturnValue(10);
    selectIsMoneyAccountTransactionEnabledMock.mockReturnValue(false);
    useMoneyAccountWithdrawableFiatMock.mockReturnValue({
      isLoading: false,
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: undefined,
    });
    mockConfirmation();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([TransactionType.perpsDeposit, TransactionType.predictDeposit])(
    'selects Money Account for %s when it has a balance and the wallet has no tokens',
    (type: TransactionType) => {
      mockMoneyAccountPay({ type });

      const { result } = runHook();

      expect(result.current.shouldSelect).toBe(true);
      expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
        TRANSACTION_ID,
        MONEY_ACCOUNT_ADDRESS,
        expect.objectContaining({ id: TRANSACTION_ID, type }),
      );
    },
  );

  it('selects Money Account when it has the highest balance', () => {
    mockMoneyAccountPay({ balance: '76' });

    const { result } = runHook({
      availableTokens: [
        {
          address: TOKEN_ADDRESS,
          chainId: '0x1',
          fiat: { balance: 2 },
        },
      ],
    });

    expect(result.current.shouldSelect).toBe(true);
    expect(applyMoneyAccountOverrideMock).toHaveBeenCalled();
  });

  it('selects Money Account when its balance beats a preferred token', () => {
    mockMoneyAccountPay({ balance: '76' });
    selectPreferredPayTokensMock.mockReturnValue([
      { address: TOKEN_ADDRESS, chainId: '0x1' },
    ] as never);

    const { result } = runHook({
      availableTokens: [
        {
          address: TOKEN_ADDRESS,
          chainId: '0x1',
          fiat: { balance: 2 },
        },
      ],
    });

    expect(result.current.shouldSelect).toBe(true);
    expect(applyMoneyAccountOverrideMock).toHaveBeenCalled();
  });

  it('keeps the highest-balance preferred token selected', () => {
    mockMoneyAccountPay({ balance: '15' });
    selectPreferredPayTokensMock.mockReturnValue([
      { address: TOKEN_ADDRESS, chainId: '0x1' },
    ] as never);

    const { result } = runHook({
      availableTokens: [
        {
          address: TOKEN_ADDRESS,
          chainId: '0x1',
          fiat: { balance: 20 },
        },
      ],
    });

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('selects Money Account above the minimum when the highest token is not preferred', () => {
    mockMoneyAccountPay({ balance: '10' });

    const { result } = runHook({
      availableTokens: [
        {
          address: TOKEN_ADDRESS,
          chainId: '0x1',
          fiat: { balance: 20 },
        },
      ],
    });

    expect(result.current.shouldSelect).toBe(true);
    expect(applyMoneyAccountOverrideMock).toHaveBeenCalled();
  });

  it('keeps the highest token selected when Money Account is below the minimum', () => {
    mockMoneyAccountPay({ balance: '9.99' });

    const { result } = runHook({
      availableTokens: [
        {
          address: TOKEN_ADDRESS,
          chainId: '0x1',
          fiat: { balance: 20 },
        },
      ],
    });

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('selects Money Account for a nested deposit type', () => {
    mockMoneyAccountPay({ type: TransactionType.batch });
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: TRANSACTION_ID,
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.perpsDeposit },
        ],
        txParams: { from: FROM_ADDRESS },
      },
    } as never);

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(true);
    expect(selectPreferredPayTokensMock).toHaveBeenCalledWith(
      expect.anything(),
      TransactionType.perpsDeposit,
    );
  });

  it('does not select Money Account when its balance is 0', () => {
    mockMoneyAccountPay({ balance: '0' });

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does not select Money Account when the transaction type is not enabled', () => {
    mockMoneyAccountPay({ enabled: false });

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does not select Money Account for a withdraw', () => {
    mockMoneyAccountPay({ type: TransactionType.perpsWithdraw });

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    TransactionType.perpsDepositAndOrder,
    TransactionType.predictDepositAndOrder,
  ])('does not select Money Account for %s', (type: TransactionType) => {
    mockMoneyAccountPay({ type });

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('returns pending while the Money Account balance is loading', () => {
    mockMoneyAccountPay({ isLoading: true });

    const { result } = runHook();

    expect(result.current.isPending).toBe(true);
    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('selects Money Account after the balance loads when the wallet has no tokens', () => {
    mockMoneyAccountPay({ isLoading: true });

    const { rerender, result } = runHook();

    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();

    useMoneyAccountWithdrawableFiatMock.mockReturnValue({
      isLoading: false,
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: '7.61',
    });

    rerender();

    expect(result.current.shouldSelect).toBe(true);
    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({ type: TransactionType.perpsDeposit }),
    );
  });

  it('does not select Money Account for a hardware wallet', () => {
    mockMoneyAccountPay();
    useIsHardwareWalletAccountMock.mockReturnValue(true);

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does not select Money Account when a pay token is already selected', () => {
    mockMoneyAccountPay();

    const { result } = runHook({ payTokenSelected: true });

    expect(result.current.shouldSelect).toBe(true);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does not select Money Account when the payment override is already Money Account', () => {
    mockMoneyAccountPay();
    selectPaymentOverrideMock.mockReturnValue(PaymentOverride.MoneyAccount);

    const { result } = runHook();

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does not select Money Account when disabled', () => {
    mockMoneyAccountPay();

    const { result } = runHook({ disable: true });

    expect(result.current.shouldSelect).toBe(false);
    expect(applyMoneyAccountOverrideMock).not.toHaveBeenCalled();
  });
});
