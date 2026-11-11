import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import type { Hex } from '@metamask/utils';
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
const TOKEN_ADDRESS_MOCK = '0x1234567890AbcdEF1234567890aBcdef12345678';
const CHAIN_ID_MOCK = '0x1';

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

  it('selects an EVM token by its checksummed ERC-20 asset ID', () => {
    const { result } = renderHookWithProvider();

    result.current.setPayToken({
      address: TOKEN_ADDRESS_MOCK.toLowerCase() as Hex,
      chainId: CHAIN_ID_MOCK,
    });

    expect(updatePaymentTokenMock).toHaveBeenCalledWith({
      transactionId: TRANSACTION_ID_MOCK,
      assetId: `eip155:1/erc20:${TOKEN_ADDRESS_MOCK}`,
    });
  });

  it('selects an EVM native token by its slip44 asset ID', () => {
    const { result } = renderHookWithProvider();

    result.current.setPayToken({
      address: '0x0000000000000000000000000000000000001010',
      chainId: '0x89',
    });

    expect(updatePaymentTokenMock).toHaveBeenCalledWith({
      transactionId: TRANSACTION_ID_MOCK,
      assetId: 'eip155:137/slip44:966',
    });
  });

  it('returns isNative true when pay token is an EVM native asset', () => {
    const { result } = renderHookWithProvider({
      payToken: { ...PAY_TOKEN_MOCK, assetId: 'eip155:1/slip44:60' },
    });

    expect(result.current.isNative).toBe(true);
  });
});
