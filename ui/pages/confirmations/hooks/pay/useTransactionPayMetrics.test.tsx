import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import {
  TransactionPayQuote,
  TransactionPayRequiredToken,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import { ConfirmContext } from '../../context/confirm';
import { useTransactionPayMetrics } from './useTransactionPayMetrics';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import type { TransactionPayAsset } from './types';

jest.mock('./useTransactionPayToken');
jest.mock('./useTransactionPayData');
jest.mock('./useTransactionPayAvailableTokens');
jest.mock('../../../../store/actions', () => ({
  updateEventFragment: jest.fn(),
}));

const TRANSACTION_ID_MOCK = 'transaction-id-mock';
const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const TOKEN_AMOUNT_MOCK = '1.23';

const PAY_TOKEN_MOCK = {
  address: TOKEN_ADDRESS_MOCK,
  chainId: CHAIN_ID_MOCK,
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

function createWrapper(type: TransactionType = TransactionType.perpsDeposit) {
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
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const useTransactionPayAvailableTokensMock = jest.mocked(
    useTransactionPayAvailableTokens,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
    });

    useTransactionPayRequiredTokensMock.mockReturnValue([
      {
        amountHuman: TOKEN_AMOUNT_MOCK,
      } as TransactionPayRequiredToken,
    ]);

    useTransactionPayQuotesMock.mockReturnValue([]);

    useTransactionPayAvailableTokensMock.mockReturnValue([
      {},
      {},
      {},
      {},
      {},
    ] as TransactionPayAsset[]);

    useTransactionPayTotalsMock.mockReturnValue(undefined);
  });

  it('renders without crashing when no pay token selected', () => {
    const { result } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.error).toBeUndefined();
  });

  it('renders with pay token selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    const { result } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.error).toBeUndefined();
  });

  it('renders with quotes', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([
      QUOTE_MOCK,
      QUOTE_MOCK,
      QUOTE_MOCK,
    ]);

    const { result } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.error).toBeUndefined();
  });

  it('renders with perps deposit type', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    const { result } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.perpsDeposit),
    });

    expect(result.error).toBeUndefined();
  });

  it('renders with predict deposit type', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    const { result } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.predictDeposit),
    });

    expect(result.error).toBeUndefined();
  });

  it('renders with totals', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      fees: {
        sourceNetwork: { estimate: { usd: '1.5', fiat: '1.6' } },
        targetNetwork: { usd: '2.5', fiat: '2.6' },
        provider: { usd: '0.5', fiat: '0.6' },
      },
    } as unknown as ReturnType<typeof useTransactionPayTotals>);

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK]);

    const { result } = renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.error).toBeUndefined();
  });
});
