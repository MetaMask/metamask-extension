import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import {
  TransactionPayStrategy,
  TransactionPayQuote,
  TransactionPayTotals,
  TransactionPayRequiredToken,
  TransactionPaySourceAmount,
} from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import { ConfirmContext } from '../../context/confirm';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
  useTransactionPayTotals,
} from './useTransactionPayData';

const TRANSACTION_ID_MOCK = 'transaction-id-mock';

const QUOTE_MOCK = {
  strategy: TransactionPayStrategy.Test,
} as TransactionPayQuote<Json>;

const REQUIRED_TOKEN_MOCK = {
  address: '0x123',
} as unknown as TransactionPayRequiredToken;

const SOURCE_AMOUNT_MOCK = {} as TransactionPaySourceAmount;

const TOTALS_MOCK = {
  total: { usd: '1000', fiat: '1234' },
} as unknown as TransactionPayTotals;

const mockStore = configureStore([]);

const STATE_MOCK = {
  metamask: {
    transactionData: {
      [TRANSACTION_ID_MOCK]: {
        isLoading: true,
        quotes: [QUOTE_MOCK],
        sourceAmounts: [SOURCE_AMOUNT_MOCK],
        tokens: [REQUIRED_TOKEN_MOCK],
        totals: TOTALS_MOCK,
      },
    },
  },
};

function createWrapper() {
  const store = mockStore(STATE_MOCK);

  const confirmContextValue = {
    currentConfirmation: { id: TRANSACTION_ID_MOCK },
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

describe('useTransactionPayData', () => {
  describe('useTransactionPayQuotes', () => {
    it('returns quotes', () => {
      const { result } = renderHook(() => useTransactionPayQuotes(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toStrictEqual([QUOTE_MOCK]);
    });
  });

  describe('useTransactionPayRequiredTokens', () => {
    it('returns required tokens', () => {
      const { result } = renderHook(() => useTransactionPayRequiredTokens(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toStrictEqual([REQUIRED_TOKEN_MOCK]);
    });
  });

  describe('useTransactionPaySourceAmounts', () => {
    it('returns source amounts', () => {
      const { result } = renderHook(() => useTransactionPaySourceAmounts(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toStrictEqual([SOURCE_AMOUNT_MOCK]);
    });
  });

  describe('useIsTransactionPayLoading', () => {
    it('returns loading state', () => {
      const { result } = renderHook(() => useIsTransactionPayLoading(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toBe(true);
    });
  });

  describe('useTransactionPayTotals', () => {
    it('returns totals', () => {
      const { result } = renderHook(() => useTransactionPayTotals(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toStrictEqual(TOTALS_MOCK);
    });
  });
});
