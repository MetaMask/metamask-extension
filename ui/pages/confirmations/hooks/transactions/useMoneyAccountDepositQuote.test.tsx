import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { ConfirmContext } from '../../context/confirm';
import {
  clearLastMoneyAccountDepositAmount,
  setLastMoneyAccountDepositAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useMoneyAccountDepositQuote } from './useMoneyAccountDepositQuote';

const TRANSACTION_ID = 'deposit-tx';

const mockStore = configureStore([]);

function createWrapper(
  quotes: {
    strategy: string;
    request?: { targetAmountMinimum?: string };
  }[],
  transactionType: TransactionType = TransactionType.moneyAccountDeposit,
) {
  const store = mockStore({
    metamask: {
      transactionData: {
        [TRANSACTION_ID]: { quotes },
      },
    },
  });
  const confirmContextValue = {
    currentConfirmation: { id: TRANSACTION_ID, type: transactionType },
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

describe('useMoneyAccountDepositQuote', () => {
  afterEach(() => {
    act(() => {
      clearLastMoneyAccountDepositAmount(TRANSACTION_ID);
    });
  });

  it('marks a positive typed amount stale while the executable quote is still Max', () => {
    act(() => {
      setLastMoneyAccountDepositAmount(TRANSACTION_ID, '1');
    });

    const { result } = renderHook(() => useMoneyAccountDepositQuote(), {
      wrapper: createWrapper([
        {
          strategy: TransactionPayStrategy.Relay,
          request: { targetAmountMinimum: '2208000' },
        },
      ]),
    });

    expect(result.current.isMoneyAccountDeposit).toBe(true);
    expect(result.current.quoteMatches).toBe(false);
    expect(result.current.isQuoteStale).toBe(true);
  });

  it('matches once the executable quote is for the typed amount', () => {
    act(() => {
      setLastMoneyAccountDepositAmount(TRANSACTION_ID, '1');
    });

    const { result } = renderHook(() => useMoneyAccountDepositQuote(), {
      wrapper: createWrapper([
        {
          strategy: TransactionPayStrategy.Relay,
          request: { targetAmountMinimum: '1000000' },
        },
      ]),
    });

    expect(result.current.quoteMatches).toBe(true);
    expect(result.current.isQuoteStale).toBe(false);
  });

  it('is not stale for a non-deposit confirmation', () => {
    act(() => {
      setLastMoneyAccountDepositAmount(TRANSACTION_ID, '1');
    });

    const { result } = renderHook(() => useMoneyAccountDepositQuote(), {
      wrapper: createWrapper(
        [
          {
            strategy: TransactionPayStrategy.Relay,
            request: { targetAmountMinimum: '2208000' },
          },
        ],
        TransactionType.musdConversion,
      ),
    });

    expect(result.current.isMoneyAccountDeposit).toBe(false);
    expect(result.current.isQuoteStale).toBe(false);
  });

  it('does not treat a confirmation without an id as a stale deposit', () => {
    const store = mockStore({ metamask: { transactionData: {} } });
    const confirmContextValue = {
      currentConfirmation: { type: TransactionType.moneyAccountDeposit },
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
    };

    const { result } = renderHook(() => useMoneyAccountDepositQuote(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ConfirmContext.Provider value={confirmContextValue as never}>
            {children}
          </ConfirmContext.Provider>
        </Provider>
      ),
    });

    expect(result.current.lastDepositAmount).toBeUndefined();
    expect(result.current.isQuoteStale).toBe(false);
  });
});
