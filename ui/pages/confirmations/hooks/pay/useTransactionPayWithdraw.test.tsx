import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { ConfirmContext } from '../../context/confirm';
import { useTransactionPayWithdraw } from './useTransactionPayWithdraw';

const mockStore = configureStore([]);

function renderUseTransactionPayWithdraw({
  type = TransactionType.moneyAccountWithdraw,
  postQuoteFlags = {
    default: { enabled: false },
    overrides: {
      moneyAccountWithdraw: { enabled: true, tokens: {} },
    },
  },
}: {
  type?: TransactionType;
  postQuoteFlags?: Record<string, unknown>;
} = {}) {
  const store = mockStore({
    metamask: {
      remoteFeatureFlags: {
        /* eslint-disable @typescript-eslint/naming-convention */
        confirmations_pay_post_quote: postQuoteFlags,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    },
  });

  const confirmContextValue = {
    currentConfirmation: {
      id: 'tx-id',
      type,
      txParams: {},
    } as TransactionMeta,
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

  return renderHook(() => useTransactionPayWithdraw(), { wrapper });
}

describe('useTransactionPayWithdraw', () => {
  it('returns isWithdraw and canSelectWithdrawToken for enabled moneyAccountWithdraw', () => {
    const { result } = renderUseTransactionPayWithdraw();

    expect(result.current).toStrictEqual({
      isWithdraw: true,
      canSelectWithdrawToken: true,
    });
  });

  it('returns canSelectWithdrawToken false when the override is disabled', () => {
    const { result } = renderUseTransactionPayWithdraw({
      postQuoteFlags: {
        default: { enabled: false },
        overrides: {
          moneyAccountWithdraw: { enabled: false, tokens: {} },
        },
      },
    });

    expect(result.current).toStrictEqual({
      isWithdraw: true,
      canSelectWithdrawToken: false,
    });
  });

  it('returns isWithdraw false for non-withdraw transaction types', () => {
    const { result } = renderUseTransactionPayWithdraw({
      type: TransactionType.moneyAccountDeposit,
    });

    expect(result.current).toStrictEqual({
      isWithdraw: false,
      canSelectWithdrawToken: false,
    });
  });
});
