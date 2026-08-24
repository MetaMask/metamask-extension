import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
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
  useIsTransactionPayQuotePending,
  useIsTransactionPayLoading,
  useTransactionPayHasExecutableQuote,
  useTransactionPayHasPositiveRequiredAmount,
  useTransactionPayIsMaxAmount,
  useTransactionPayIsPostQuote,
  useTransactionPayPrimaryRequiredToken,
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
  useTransactionPayTotals,
} from './useTransactionPayData';

const TRANSACTION_ID_MOCK = 'transaction-id-mock';

const QUOTE_MOCK = {
  strategy: TransactionPayStrategy.Relay,
} as TransactionPayQuote<Json>;

const REQUIRED_TOKEN_MOCK = {
  address: '0x123',
  amountRaw: '1000000',
  skipIfBalance: false,
} as unknown as TransactionPayRequiredToken;

const GAS_TOKEN_MOCK = {
  address: '0x456',
  skipIfBalance: true,
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
        isMaxAmount: true,
        isPostQuote: true,
        quotes: [QUOTE_MOCK],
        sourceAmounts: [SOURCE_AMOUNT_MOCK],
        tokens: [REQUIRED_TOKEN_MOCK],
        totals: TOTALS_MOCK,
      },
    },
  },
};

function createWrapper(
  stateOverrides?: Partial<
    (typeof STATE_MOCK)['metamask']['transactionData'][typeof TRANSACTION_ID_MOCK]
  >,
  transactionType?: TransactionType,
) {
  const state = stateOverrides
    ? {
        metamask: {
          transactionData: {
            [TRANSACTION_ID_MOCK]: {
              ...STATE_MOCK.metamask.transactionData[TRANSACTION_ID_MOCK],
              ...stateOverrides,
            },
          },
        },
      }
    : STATE_MOCK;

  const store = mockStore(state);

  const confirmContextValue = {
    currentConfirmation: { id: TRANSACTION_ID_MOCK, type: transactionType },
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

  describe('useTransactionPayHasExecutableQuote', () => {
    it('returns true when an executable quote exists', () => {
      const { result } = renderHook(
        () => useTransactionPayHasExecutableQuote(),
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current).toBe(true);
    });

    it('returns false when quotes use the none strategy', () => {
      const { result } = renderHook(
        () => useTransactionPayHasExecutableQuote(),
        {
          wrapper: createWrapper({
            quotes: [
              {
                strategy: TransactionPayStrategy.None,
              } as TransactionPayQuote<Json>,
            ],
          }),
        },
      );

      expect(result.current).toBe(false);
    });

    it('returns false when quotes are unavailable', () => {
      const { result } = renderHook(
        () => useTransactionPayHasExecutableQuote(),
        {
          wrapper: createWrapper({ quotes: undefined }),
        },
      );

      expect(result.current).toBe(false);
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

  describe('useTransactionPayHasPositiveRequiredAmount', () => {
    it('returns true when a required token has a positive amount', () => {
      const { result } = renderHook(
        () => useTransactionPayHasPositiveRequiredAmount(),
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current).toBe(true);
    });

    it('returns false when the required amount is zero', () => {
      const { result } = renderHook(
        () => useTransactionPayHasPositiveRequiredAmount(),
        {
          wrapper: createWrapper({
            tokens: [{ ...REQUIRED_TOKEN_MOCK, amountRaw: '0' }],
          }),
        },
      );

      expect(result.current).toBe(false);
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

  describe('useTransactionPayIsMaxAmount', () => {
    it('returns isMaxAmount state', () => {
      const { result } = renderHook(() => useTransactionPayIsMaxAmount(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toBe(true);
    });
  });

  describe('useTransactionPayIsPostQuote', () => {
    it('returns isPostQuote state', () => {
      const { result } = renderHook(() => useTransactionPayIsPostQuote(), {
        wrapper: createWrapper(),
      });
      expect(result.current).toBe(true);
    });
  });

  describe('useIsTransactionPayQuotePending', () => {
    it('returns false for Perps Withdraw before an amount is entered', () => {
      const { result } = renderHook(() => useIsTransactionPayQuotePending(), {
        wrapper: createWrapper(
          {
            isLoading: true,
            isPostQuote: false,
            tokens: [{ ...REQUIRED_TOKEN_MOCK, amountRaw: '0' }],
          },
          TransactionType.perpsWithdraw,
        ),
      });

      expect(result.current).toBe(false);
    });

    it('returns true while Perps Withdraw post-quote setup is pending', () => {
      const { result } = renderHook(() => useIsTransactionPayQuotePending(), {
        wrapper: createWrapper(
          { isLoading: false, isPostQuote: false },
          TransactionType.perpsWithdraw,
        ),
      });

      expect(result.current).toBe(true);
    });

    it('returns false after Perps Withdraw post-quote setup completes', () => {
      const { result } = renderHook(() => useIsTransactionPayQuotePending(), {
        wrapper: createWrapper(
          { isLoading: false, isPostQuote: true },
          TransactionType.perpsWithdraw,
        ),
      });

      expect(result.current).toBe(false);
    });

    it('uses the existing loading state for other transaction types', () => {
      const { result } = renderHook(() => useIsTransactionPayQuotePending(), {
        wrapper: createWrapper(
          { isLoading: false, isPostQuote: false },
          TransactionType.musdConversion,
        ),
      });

      expect(result.current).toBe(false);
    });
  });

  describe('useTransactionPayPrimaryRequiredToken', () => {
    it('returns the first required token without skipIfBalance', () => {
      const { result } = renderHook(
        () => useTransactionPayPrimaryRequiredToken(),
        { wrapper: createWrapper() },
      );
      expect(result.current).toStrictEqual(REQUIRED_TOKEN_MOCK);
    });

    it('skips tokens with skipIfBalance', () => {
      const { result } = renderHook(
        () => useTransactionPayPrimaryRequiredToken(),
        {
          wrapper: createWrapper({
            tokens: [GAS_TOKEN_MOCK, REQUIRED_TOKEN_MOCK],
          }),
        },
      );
      expect(result.current).toStrictEqual(REQUIRED_TOKEN_MOCK);
    });

    it('returns undefined when all tokens have skipIfBalance', () => {
      const { result } = renderHook(
        () => useTransactionPayPrimaryRequiredToken(),
        { wrapper: createWrapper({ tokens: [GAS_TOKEN_MOCK] }) },
      );
      expect(result.current).toBeUndefined();
    });
  });
});
