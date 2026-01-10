import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import type { TransactionPayRequiredToken } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import { useAutomaticTransactionPayToken } from './useAutomaticTransactionPayToken';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import { ConfirmContext } from '../../context/confirm';
import type { TransactionPayAsset, SetPayTokenRequest } from './types';

jest.mock('./useTransactionPayToken');
jest.mock('./useTransactionPayData');
jest.mock('./useTransactionPayAvailableTokens');
jest.mock('../../../../selectors', () => ({
  getHardwareWalletType: jest.fn(() => null),
}));

const TOKEN_ADDRESS_1_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const TOKEN_ADDRESS_2_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const TOKEN_ADDRESS_3_MOCK = '0xabc1234567890abcdef1234567890abcdef12345678';
const PREFERRED_TOKEN_ADDRESS_MOCK =
  '0x9999999999999999999999999999999999999999';
const CHAIN_ID_1_MOCK = '0x1';
const CHAIN_ID_2_MOCK = '0x2';
const PREFERRED_CHAIN_ID_MOCK = '0x3';
const TRANSACTION_ID_MOCK = 'transaction-id-mock';

const mockStore = configureStore([]);

const STATE_MOCK = {
  metamask: {
    TransactionPayController: {
      transactionData: {},
    },
  },
};

function renderHookWithProvider({
  disable = false,
  preferredToken,
}: {
  disable?: boolean;
  preferredToken?: SetPayTokenRequest;
} = {}) {
  const store = mockStore(STATE_MOCK);

  const confirmContextValue = {
    currentConfirmation: {
      id: TRANSACTION_ID_MOCK,
      txParams: { from: '0x123' },
    },
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

  return renderHook(
    () => useAutomaticTransactionPayToken({ disable, preferredToken }),
    { wrapper },
  );
}

describe('useAutomaticTransactionPayToken', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayAvailableTokensMock = jest.mocked(
    useTransactionPayAvailableTokens,
  );
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );

  const setPayTokenMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: setPayTokenMock,
    });

    useTransactionPayRequiredTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK as Hex,
        chainId: CHAIN_ID_1_MOCK as Hex,
      } as TransactionPayRequiredToken,
    ]);

    useTransactionPayAvailableTokensMock.mockReturnValue([]);
  });

  it('selects first token', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_2_MOCK,
        chainId: CHAIN_ID_2_MOCK,
      },
      {
        address: TOKEN_ADDRESS_3_MOCK,
        chainId: CHAIN_ID_2_MOCK,
      },
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
    ] as TransactionPayAsset[]);

    renderHookWithProvider();

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: TOKEN_ADDRESS_2_MOCK,
      chainId: CHAIN_ID_2_MOCK,
    });
  });

  it('selects target token if no tokens with balance', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue(
      [] as TransactionPayAsset[],
    );

    renderHookWithProvider();

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: TOKEN_ADDRESS_1_MOCK,
      chainId: CHAIN_ID_1_MOCK,
    });
  });

  it('does nothing if no required tokens', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([]);
    useTransactionPayRequiredTokensMock.mockReturnValue([]);

    renderHookWithProvider();

    expect(setPayTokenMock).not.toHaveBeenCalled();
  });

  it('does nothing if disabled', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
    ] as TransactionPayAsset[]);

    renderHookWithProvider({ disable: true });

    expect(setPayTokenMock).not.toHaveBeenCalled();
  });

  it('selects preferred payment token when provided with available tokens', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
      {
        address: PREFERRED_TOKEN_ADDRESS_MOCK,
        chainId: PREFERRED_CHAIN_ID_MOCK,
      },
      {
        address: TOKEN_ADDRESS_2_MOCK,
        chainId: CHAIN_ID_2_MOCK,
      },
    ] as TransactionPayAsset[]);

    renderHookWithProvider({
      preferredToken: {
        address: PREFERRED_TOKEN_ADDRESS_MOCK as Hex,
        chainId: PREFERRED_CHAIN_ID_MOCK as Hex,
      },
    });

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: PREFERRED_TOKEN_ADDRESS_MOCK,
      chainId: PREFERRED_CHAIN_ID_MOCK,
    });
  });

  it('selects target token when preferred payment token provided but no tokens available', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue(
      [] as TransactionPayAsset[],
    );

    renderHookWithProvider({
      preferredToken: {
        address: PREFERRED_TOKEN_ADDRESS_MOCK as Hex,
        chainId: PREFERRED_CHAIN_ID_MOCK as Hex,
      },
    });

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: TOKEN_ADDRESS_1_MOCK,
      chainId: CHAIN_ID_1_MOCK,
    });
  });

  it('selects first available token when preferred token not in available tokens', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
      {
        address: TOKEN_ADDRESS_2_MOCK,
        chainId: CHAIN_ID_2_MOCK,
      },
    ] as TransactionPayAsset[]);

    renderHookWithProvider({
      preferredToken: {
        address: PREFERRED_TOKEN_ADDRESS_MOCK as Hex,
        chainId: PREFERRED_CHAIN_ID_MOCK as Hex,
      },
    });

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: TOKEN_ADDRESS_1_MOCK,
      chainId: CHAIN_ID_1_MOCK,
    });
  });
});
