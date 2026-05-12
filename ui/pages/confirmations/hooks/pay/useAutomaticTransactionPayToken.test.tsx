import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionPayRequiredToken } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import { ConfirmContext } from '../../context/confirm';
import { Asset } from '../../types/send';
import { useAutomaticTransactionPayToken } from './useAutomaticTransactionPayToken';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import type { SetPayTokenRequest } from './types';
import { usePostQuoteWithdrawTokenFilter } from './useWithdrawTokenFilter';

jest.mock('./useTransactionPayToken');
jest.mock('./useTransactionPayData');
jest.mock('./useTransactionPayAvailableTokens');
jest.mock('./useWithdrawTokenFilter');
jest.mock('../../../../selectors', () => ({}));
jest.mock('../../../../../shared/lib/selectors/keyring', () => ({
  ...jest.requireActual('../../../../../shared/lib/selectors/keyring'),
  getHardwareWalletType: jest.fn(),
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
  transactionType,
  transactionId = TRANSACTION_ID_MOCK,
}: {
  disable?: boolean;
  preferredToken?: SetPayTokenRequest;
  transactionType?: TransactionType;
  transactionId?: string;
} = {}) {
  const store = mockStore(STATE_MOCK);

  const confirmContextValue = {
    currentConfirmation: {
      id: transactionId,
      type: transactionType,
      txParams: { from: '0x123' },
    },
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
  };

  const wrapper = ({ children }: React.PropsWithChildren<unknown>) => (
    <Provider store={store}>
      <ConfirmContext.Provider value={confirmContextValue as never}>
        {children}
      </ConfirmContext.Provider>
    </Provider>
  );

  return renderHook(
    ({
      currentDisable = disable,
      currentPreferredToken = preferredToken,
    }: {
      currentDisable?: boolean;
      currentPreferredToken?: SetPayTokenRequest;
    } = {}) =>
      useAutomaticTransactionPayToken({
        disable: currentDisable,
        preferredToken: currentPreferredToken,
      }),
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
  const usePostQuoteWithdrawTokenFilterMock = jest.mocked(
    usePostQuoteWithdrawTokenFilter,
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
    usePostQuoteWithdrawTokenFilterMock.mockReturnValue({
      filterTokens: (tokens) => tokens,
      isFilterApplied: false,
      isTokenAllowed: () => false,
    });
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
    ] as Asset[]);

    renderHookWithProvider();

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: TOKEN_ADDRESS_2_MOCK,
      chainId: CHAIN_ID_2_MOCK,
    });
  });

  it('selects target token if no tokens with balance', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([] as Asset[]);

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
    ] as Asset[]);

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
    ] as Asset[]);

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
    useTransactionPayAvailableTokensMock.mockReturnValue([] as Asset[]);

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
    ] as Asset[]);

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

  it('selects preferred token without availability check for perpsWithdraw', () => {
    // The user is RECEIVING this token via Relay; they typically have $0
    // wallet balance of it, so the regular `availableTokens` membership check
    // would otherwise fall through to the first balance token.
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
    ] as Asset[]);

    renderHookWithProvider({
      transactionType: TransactionType.perpsWithdraw,
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

  it('selects the first allowlisted withdraw token when the preferred token is not allowlisted', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
    ] as Asset[]);
    usePostQuoteWithdrawTokenFilterMock.mockReturnValue({
      filterTokens: () =>
        [
          {
            address: TOKEN_ADDRESS_2_MOCK,
            chainId: CHAIN_ID_2_MOCK,
          },
        ] as Asset[],
      isFilterApplied: true,
      isTokenAllowed: () => false,
    });

    renderHookWithProvider({
      transactionType: TransactionType.perpsWithdraw,
      preferredToken: {
        address: PREFERRED_TOKEN_ADDRESS_MOCK as Hex,
        chainId: PREFERRED_CHAIN_ID_MOCK as Hex,
      },
    });

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: TOKEN_ADDRESS_2_MOCK,
      chainId: CHAIN_ID_2_MOCK,
    });
  });

  it('selects an allowlisted preferred withdraw token before enrichment adds it to the token list', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_1_MOCK,
        chainId: CHAIN_ID_1_MOCK,
      },
    ] as Asset[]);
    usePostQuoteWithdrawTokenFilterMock.mockReturnValue({
      filterTokens: () =>
        [
          {
            address: TOKEN_ADDRESS_2_MOCK,
            chainId: CHAIN_ID_2_MOCK,
          },
        ] as Asset[],
      isFilterApplied: true,
      isTokenAllowed: (chainId, address) =>
        chainId.toLowerCase() === PREFERRED_CHAIN_ID_MOCK &&
        address.toLowerCase() === PREFERRED_TOKEN_ADDRESS_MOCK,
    });

    renderHookWithProvider({
      transactionType: TransactionType.perpsWithdraw,
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

  it('does nothing when payToken is already set', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        address: TOKEN_ADDRESS_2_MOCK as Hex,
        chainId: CHAIN_ID_2_MOCK as Hex,
      } as never,
      setPayToken: setPayTokenMock,
    });
    useTransactionPayAvailableTokensMock.mockReturnValue([
      { address: TOKEN_ADDRESS_1_MOCK, chainId: CHAIN_ID_1_MOCK },
    ] as Asset[]);

    renderHookWithProvider();

    expect(setPayTokenMock).not.toHaveBeenCalled();
  });

  it('does not re-dispatch on re-render for the same transactionId', () => {
    useTransactionPayAvailableTokensMock.mockReturnValue([
      { address: TOKEN_ADDRESS_2_MOCK, chainId: CHAIN_ID_2_MOCK },
    ] as Asset[]);

    const { rerender } = renderHookWithProvider();

    expect(setPayTokenMock).toHaveBeenCalledTimes(1);

    rerender();

    expect(setPayTokenMock).toHaveBeenCalledTimes(1);
  });
});
