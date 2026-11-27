import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import {
  PaymentOverride,
  type TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import * as controllerActions from '../../../../store/controller-actions/transaction-pay-controller';
import { ConfirmContext } from '../../context/confirm';
import { useTransactionPayToken } from './useTransactionPayToken';

jest.mock(
  '../../../../store/controller-actions/transaction-pay-controller',
  () => ({
    setPaymentOverride: jest.fn(),
    updateTransactionPaymentToken: jest.fn(),
  }),
);

const TRANSACTION_ID_MOCK = 'transaction-id-mock';
const TOKEN_ADDRESS_MOCK = '0x1234567890AbcdEF1234567890aBcdef12345678';

const PAY_TOKEN_MOCK: TransactionPaymentToken = {
  assetId: `eip155:1/erc20:${TOKEN_ADDRESS_MOCK}`,
  balanceHuman: '123.456',
  balanceFiat: '456.12',
  balanceUsd: '456.123',
  balanceRaw: '123456000000000000000',
  decimals: 4,
  symbol: 'TST',
};

const mockStore = configureStore([]);

function createMockState({
  payToken,
}: {
  payToken?: TransactionPaymentToken;
} = {}) {
  return {
    metamask: {
      transactionData: {
        [TRANSACTION_ID_MOCK]: {
          isLoading: false,
          paymentToken: payToken,
          tokens: [],
        },
      },
    },
  };
}

function renderHookWithProvider({
  payToken,
  transactionType,
}: {
  payToken?: TransactionPaymentToken;
  transactionType?: TransactionType;
} = {}) {
  const state = createMockState({ payToken });
  const store = mockStore(state);

  const confirmContextValue = {
    currentConfirmation: { id: TRANSACTION_ID_MOCK, type: transactionType },
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ConfirmContext.Provider value={confirmContextValue as never}>
        {children}
      </ConfirmContext.Provider>
    </Provider>
  );

  return renderHook(() => useTransactionPayToken(), { wrapper });
}

describe('useTransactionPayToken', () => {
  const updatePaymentTokenMock = jest.mocked(
    controllerActions.updateTransactionPaymentToken,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns undefined if no state', () => {
    const { result } = renderHookWithProvider();

    expect(result.current.payToken).toBeUndefined();
    expect(result.current.isNative).toBeFalsy();
  });

  it('returns token matching state', () => {
    const { result } = renderHookWithProvider({
      payToken: PAY_TOKEN_MOCK,
    });

    expect(result.current.payToken).toStrictEqual(PAY_TOKEN_MOCK);
    expect(result.current.isNative).toBe(false);
  });

  it('selects a payment token by its asset ID', () => {
    const { result } = renderHookWithProvider();

    result.current.setPayToken({
      assetId: `eip155:1/erc20:${TOKEN_ADDRESS_MOCK}`,
    });

    expect(updatePaymentTokenMock).toHaveBeenCalledWith({
      transactionId: TRANSACTION_ID_MOCK,
      assetId: `eip155:1/erc20:${TOKEN_ADDRESS_MOCK}`,
    });
  });

  describe('Money Account deposit', () => {
    const SOLANA_ASSET_ID =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as const;
    const setPaymentOverrideMock = jest.mocked(
      controllerActions.setPaymentOverride,
    );

    it('sets the non-atomic Money Account override before selecting a Solana source', async () => {
      const { result } = renderHookWithProvider({
        transactionType: TransactionType.moneyAccountDeposit,
      });

      await result.current.setPayToken({ assetId: SOLANA_ASSET_ID });

      expect(setPaymentOverrideMock).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, {
        atomic: false,
        paymentOverride: PaymentOverride.MoneyAccount,
      });
      expect(setPaymentOverrideMock.mock.invocationCallOrder[0]).toBeLessThan(
        updatePaymentTokenMock.mock.invocationCallOrder[0],
      );
    });

    it('clears the override when switching from a Solana source to an EVM token', async () => {
      const { result } = renderHookWithProvider({
        payToken: { ...PAY_TOKEN_MOCK, assetId: SOLANA_ASSET_ID },
        transactionType: TransactionType.moneyAccountDeposit,
      });

      await result.current.setPayToken({ assetId: PAY_TOKEN_MOCK.assetId });

      expect(setPaymentOverrideMock).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, {
        paymentOverride: undefined,
      });
    });

    it('does not change the override when switching between EVM tokens', async () => {
      const { result } = renderHookWithProvider({
        payToken: PAY_TOKEN_MOCK,
        transactionType: TransactionType.moneyAccountDeposit,
      });

      await result.current.setPayToken({ assetId: 'eip155:1/slip44:60' });

      expect(setPaymentOverrideMock).not.toHaveBeenCalled();
    });

    it('does not set the override for a Solana source on another transaction type', async () => {
      const { result } = renderHookWithProvider({
        transactionType: TransactionType.perpsDeposit,
      });

      await result.current.setPayToken({ assetId: SOLANA_ASSET_ID });

      expect(setPaymentOverrideMock).not.toHaveBeenCalled();
    });
  });

  it('returns isNative from the CAIP asset namespace for non-EVM tokens', () => {
    const solanaPayToken: TransactionPaymentToken = {
      assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      balanceFiat: '150',
      balanceHuman: '1.5',
      balanceRaw: '1500000000',
      balanceUsd: '150',
      decimals: 9,
      symbol: 'SOL',
    };

    const { result: nativeResult } = renderHookWithProvider({
      payToken: solanaPayToken,
    });
    const { result: splResult } = renderHookWithProvider({
      payToken: {
        ...solanaPayToken,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      },
    });

    expect(nativeResult.current.isNative).toBe(true);
    expect(splResult.current.isNative).toBe(false);
  });

  it('returns isNative true when pay token is an EVM native asset', () => {
    const { result } = renderHookWithProvider({
      payToken: { ...PAY_TOKEN_MOCK, assetId: 'eip155:1/slip44:60' },
    });

    expect(result.current.isNative).toBe(true);
  });
});
