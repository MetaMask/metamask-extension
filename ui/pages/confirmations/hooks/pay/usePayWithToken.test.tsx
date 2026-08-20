import React from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  PaymentOverride,
  type TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../context/confirm';
import { selectPaymentOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { MONEY_ACCOUNT_DUMMY_BALANCE_FIAT } from './sections/usePayWithMoneyAccountSection';
import { usePayWithToken } from './usePayWithToken';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('./useTransactionPayToken', () => ({
  useTransactionPayToken: jest.fn(),
}));
jest.mock('./useTransactionPayData', () => ({
  useTransactionPayRequiredTokens: jest.fn(),
}));
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectPaymentOverrideByTransactionId: jest.fn(),
}));
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const messages: Record<string, string> = {
      payWith: 'Pay with',
      withdrawTo: 'Withdraw to',
      payWithMoneyAccount: 'Money account',
    };
    return messages[key] ?? key;
  },
}));
jest.mock('../../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (value: number) => `$${value.toFixed(2)}`,
}));
jest.mock('../../components/modals/pay-with-modal', () => ({
  PayWithModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="pay-with-modal" /> : null,
}));

const FROM_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';

const PAY_TOKEN = {
  address: '0x1111111111111111111111111111111111111111',
  chainId: '0x1',
  symbol: 'USDC',
  balanceUsd: '25',
  balanceFiat: '$25.00',
  balanceHuman: '25',
  balanceRaw: '25000000',
  decimals: 6,
} as TransactionPaymentToken;

const ACCOUNT = {
  address: FROM_ADDRESS,
  metadata: { keyring: { type: 'HD Key Tree' } },
};

describe('usePayWithToken', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const selectPaymentOverrideByTransactionIdMock = jest.mocked(
    selectPaymentOverrideByTransactionId,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
        txParams: { from: FROM_ADDRESS },
      } as TransactionMeta,
    } as ReturnType<typeof useConfirmContext>);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN,
      setPayToken: jest.fn(),
      isNative: false,
    });
    useTransactionPayRequiredTokensMock.mockReturnValue([]);
    selectPaymentOverrideByTransactionIdMock.mockReturnValue(undefined);

    useSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) => selector({}),
    );
  });

  it('returns the crypto pay token display values by default', () => {
    const { result } = renderHook(() => usePayWithToken());

    expect(result.current.displayToken).toMatchObject({
      address: PAY_TOKEN.address,
      chainId: PAY_TOKEN.chainId,
      symbol: 'USDC',
    });
    expect(result.current.balanceUsdFormatted).toBe('$25.00');
    expect(result.current.label).toBe('Pay with');
    expect(result.current.isMoneyAccountSelected).toBe(false);
  });

  it('returns Money account display values when paymentOverride is MoneyAccount', () => {
    selectPaymentOverrideByTransactionIdMock.mockReturnValue(
      PaymentOverride.MoneyAccount,
    );

    const { result } = renderHook(() => usePayWithToken());

    expect(result.current.isMoneyAccountSelected).toBe(true);
    expect(result.current.displayToken).toMatchObject({
      address: '',
      symbol: 'Money account',
      balanceUsd: MONEY_ACCOUNT_DUMMY_BALANCE_FIAT,
    });
    expect(result.current.balanceUsdFormatted).toBe(
      MONEY_ACCOUNT_DUMMY_BALANCE_FIAT,
    );
  });

  it('uses the withdraw label for perps withdraw', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-1',
        type: TransactionType.perpsWithdraw,
        txParams: { from: FROM_ADDRESS },
      } as TransactionMeta,
    } as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() => usePayWithToken());

    expect(result.current.label).toBe('Withdraw to');
    expect(result.current.isPostQuoteWithdraw).toBe(true);
  });

  it('opens the pay with modal when editable', () => {
    const { result } = renderHook(() => usePayWithToken());

    expect(result.current.modal).toBeNull();

    act(() => {
      result.current.openModal();
    });

    expect(result.current.modal).not.toBeNull();
  });

  it('waits for payToken on perps withdraw instead of falling back to required token', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-1',
        type: TransactionType.perpsWithdraw,
        txParams: { from: FROM_ADDRESS },
      } as TransactionMeta,
    } as ReturnType<typeof useConfirmContext>);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
      isNative: false,
    });
    useTransactionPayRequiredTokensMock.mockReturnValue([PAY_TOKEN as never]);

    const { result } = renderHook(() => usePayWithToken());

    expect(result.current.displayToken).toBeUndefined();
  });
});
