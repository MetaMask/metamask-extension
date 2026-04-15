/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import {
  TransactionPayQuote,
  TransactionPayRequiredToken,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { Json } from '@metamask/utils';
import { ConfirmContext } from '../../context/confirm';
import { Asset } from '../../types/send';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { useTransactionPayMetrics } from './useTransactionPayMetrics';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from './useTransactionPayData';
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
const TOKEN_AMOUNT_MOCK = '1.23';

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
    ] as Asset[]);

    useTransactionPayTotalsMock.mockReturnValue(undefined);
  });

  it('does not upsert fragment when no pay token is selected', () => {
    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).not.toHaveBeenCalled();
  });

  it('upserts mm_pay properties via transaction UI metrics fragment when pay token is selected', () => {
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
          mm_pay: true,
          mm_pay_token_selected: 'TST',
          mm_pay_chain_selected: CHAIN_ID_MOCK,
          mm_pay_payment_token_list_size: 5,
        }),
      },
    );
  });

  it('includes mm_pay_strategy when quotes use Bridge strategy', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([
      QUOTE_MOCK,
      QUOTE_MOCK,
      QUOTE_MOCK,
    ]);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay: true,
          mm_pay_strategy: 'mm_swaps_bridge',
          mm_pay_transaction_step_total: 4,
        }),
      },
    );
  });

  it('includes mm_pay_strategy as relay when quotes use Relay strategy', () => {
    const relayQuote = {
      ...QUOTE_MOCK,
      strategy: TransactionPayStrategy.Relay,
    } as TransactionPayQuote<Json>;

    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([relayQuote]);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_strategy: 'relay',
        }),
      },
    );
  });

  it('includes custom_amount use case and sending value for perpsDeposit transactions', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.perpsDeposit),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_use_case: 'custom_amount',
          simulation_sending_assets_total_value: expect.any(Number),
        }),
      },
    );
  });

  it('does not include custom_amount use case for non-perpsDeposit transactions', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.musdConversion),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.not.objectContaining({
          mm_pay_use_case: 'custom_amount',
        }),
      },
    );
  });

  it('includes fee properties when totals are available', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayTotalsMock.mockReturnValue({
      fees: {
        sourceNetwork: { estimate: { usd: '1.5', fiat: '1.6' } },
        targetNetwork: { usd: '2.5', fiat: '2.6' },
        provider: { usd: '0.5', fiat: '0.6' },
      },
    } as unknown as ReturnType<typeof useTransactionPayTotals>);

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK]);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_network_fee_usd: '4',
          mm_pay_provider_fee_usd: '0.5',
        }),
      },
    );
  });
});
