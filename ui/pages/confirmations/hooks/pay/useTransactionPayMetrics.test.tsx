/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import {
  TransactionPayQuote,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { Json } from '@metamask/utils';
import { ConfirmContext } from '../../context/confirm';
import { Asset } from '../../types/send';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { useTransactionPayMetrics } from './useTransactionPayMetrics';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayQuotes } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

jest.mock('./useTransactionPayToken');
jest.mock('./useTransactionPayData');
jest.mock('./useTransactionPayAvailableTokens');
jest.mock('../../../../store/actions', () => ({
  upsertTransactionUIMetricsFragment: jest.fn(),
}));

const TRANSACTION_ID_MOCK = 'transaction-id-mock';
const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';

const PAY_TOKEN_MOCK = {
  address: TOKEN_ADDRESS_MOCK,
  balanceFiat: '100.00',
  balanceHuman: '50',
  balanceRaw: '50000000000000000000',
  balanceUsd: '100.00',
  chainId: CHAIN_ID_MOCK,
  decimals: 18,
  symbol: 'TST',
};

const QUOTE_MOCK = {
  dust: {
    fiat: '0.6',
    usd: '0.5',
  },
  strategy: TransactionPayStrategy.Bridge,
} as TransactionPayQuote<Json>;

const mockStore = configureStore([]);

function createWrapper(type: string = TransactionType.perpsDeposit) {
  const state = {
    metamask: {
      TransactionPayController: {
        transactionData: {},
      },
    },
  };

  const store = mockStore(state);

  const confirmContextValue = {
    currentConfirmation: {
      id: TRANSACTION_ID_MOCK,
      chainId: CHAIN_ID_MOCK,
      type,
      txParams: { from: '0x123' },
    },
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
  };

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ConfirmContext.Provider value={confirmContextValue as never}>
        {children}
      </ConfirmContext.Provider>
    </Provider>
  );
}

describe('useTransactionPayMetrics', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useTransactionPayAvailableTokensMock = jest.mocked(
    useTransactionPayAvailableTokens,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
    });

    useTransactionPayQuotesMock.mockReturnValue([]);

    useTransactionPayAvailableTokensMock.mockReturnValue([
      {},
      {},
      {},
      {},
      {},
    ] as Asset[]);
  });

  it('does not upsert fragment when no pay token is selected', () => {
    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).not.toHaveBeenCalled();
  });

  it('upserts UI-context mm_pay properties when pay token is selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_payment_token_list_size: 5,
          mm_pay_token_presented: 'TST',
          mm_pay_chain_presented: CHAIN_ID_MOCK,
        }),
      },
    );
  });

  it('sets mm_pay_quote_loaded to false initially', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_quote_loaded: false,
        }),
      },
    );
  });

  it('sets mm_pay_quote_loaded to true when quotes are available', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK]);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_quote_loaded: true,
        }),
      },
    );
  });

  it('updates mm_pay_quote_loaded from false to true when quotes arrive after initial render', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([]);

    const { rerender } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenLastCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_quote_loaded: false,
        }),
      },
    );

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK]);
    rerender();

    expect(upsertTransactionUIMetricsFragment).toHaveBeenLastCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_quote_loaded: true,
        }),
      },
    );
  });

  it('sets mm_pay_quote_requested to false by default', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_quote_requested: false,
        }),
      },
    );
  });

  it('sets mm_pay_chain_highest_balance_caip to null by default', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_chain_highest_balance_caip: null,
        }),
      },
    );
  });
});
