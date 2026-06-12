import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import * as controllerActions from '../../../../store/controller-actions/transaction-pay-controller';
import { ConfirmContext } from '../../context/confirm';
import { useTransactionPayToken } from './useTransactionPayToken';

jest.mock(
  '../../../../store/controller-actions/transaction-pay-controller',
  () => ({
    updateTransactionPaymentToken: jest.fn(),
  }),
);

const TRANSACTION_ID_MOCK = 'transaction-id-mock';
const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const CHAIN_ID_MOCK = '0x1';

const PAY_TOKEN_MOCK = {
  address: TOKEN_ADDRESS_MOCK,
  balanceHuman: '123.456',
  balanceFiat: '456.12',
  balanceUsd: '456.123',
  balanceRaw: '123456000000000000000',
  chainId: CHAIN_ID_MOCK,
  decimals: 4,
  symbol: 'TST',
} as TransactionPaymentToken;

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
}: {
  payToken?: TransactionPaymentToken;
} = {}) {
  const state = createMockState({ payToken });
  const store = mockStore(state);

  const confirmContextValue = {
    currentConfirmation: { id: TRANSACTION_ID_MOCK },
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

  it('sets token in state', () => {
    const { result } = renderHookWithProvider();

    result.current.setPayToken({
      address: PAY_TOKEN_MOCK.address,
      chainId: PAY_TOKEN_MOCK.chainId,
    });

    expect(updatePaymentTokenMock).toHaveBeenCalledWith({
      transactionId: TRANSACTION_ID_MOCK,
      tokenAddress: PAY_TOKEN_MOCK.address,
      chainId: PAY_TOKEN_MOCK.chainId,
    });
  });

  it('returns isNative true when pay token is native address', () => {
    const { result } = renderHookWithProvider({
      payToken: {
        ...PAY_TOKEN_MOCK,
        address: '0x0000000000000000000000000000000000000000',
      } as TransactionPaymentToken,
    });

    expect(result.current.isNative).toBe(true);
  });
});
