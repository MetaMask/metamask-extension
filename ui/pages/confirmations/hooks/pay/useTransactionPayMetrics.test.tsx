/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import {
  TransactionPayQuote,
  TransactionPayStrategy,
  TransactionPayTotals,
} from '@metamask/transaction-pay-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { Json } from '@metamask/utils';
import { ConfirmContext } from '../../context/confirm';
import { Asset } from '../../types/send';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { useTransactionPayMetrics } from './useTransactionPayMetrics';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  useTransactionPayPrimaryRequiredToken,
  useTransactionPayQuotes,
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

const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

const QUOTE_MOCK = {
  dust: {
    fiat: '0.6',
    usd: '0.5',
  },
  request: {
    targetTokenAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
  strategy: TransactionPayStrategy.Bridge,
} as unknown as TransactionPayQuote<Json>;

const GAS_QUOTE_MOCK = {
  dust: {
    fiat: '0.1',
    usd: '0.1',
  },
  request: {
    targetTokenAddress: NATIVE_TOKEN_ADDRESS,
  },
  strategy: TransactionPayStrategy.Bridge,
} as unknown as TransactionPayQuote<Json>;

const TOTALS_MOCK: TransactionPayTotals = {
  estimatedDuration: 60,
  fees: {
    metaMask: { fiat: '0.50', usd: '0.50' },
    provider: { fiat: '0.25', usd: '0.25' },
    sourceNetwork: {
      estimate: { fiat: '0.10', usd: '0.10', human: '0.001', raw: '1000000' },
      max: { fiat: '0.20', usd: '0.20', human: '0.002', raw: '2000000' },
    },
    targetNetwork: { fiat: '0.05', usd: '0.05' },
  },
  sourceAmount: { fiat: '100', usd: '100', human: '50', raw: '50000000' },
  targetAmount: { fiat: '99', usd: '99' },
  total: { fiat: '100.85', usd: '100.85' },
};

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
  const useTransactionPayPrimaryRequiredTokenMock = jest.mocked(
    useTransactionPayPrimaryRequiredToken,
  );
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayAvailableTokensMock = jest.mocked(
    useTransactionPayAvailableTokens,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue(undefined);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
    });

    useTransactionPayQuotesMock.mockReturnValue([]);
    useTransactionPayTotalsMock.mockReturnValue(undefined);

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

  it('does not set mm_pay_quote_requested (managed by useTransactionCustomAmount)', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    const call = jest.mocked(upsertTransactionUIMetricsFragment).mock.calls[0];
    const { properties } = call[1] as { properties: Record<string, unknown> };

    expect(properties).not.toHaveProperty('mm_pay_quote_requested');
  });

  it('sets mm_pay_token_selected from payToken symbol', () => {
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
          mm_pay_token_selected: 'TST',
        }),
      },
    );
  });

  it('sets mm_pay_transaction_step_total and mm_pay_transaction_step based on quotes length', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK, GAS_QUOTE_MOCK]);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_transaction_step_total: 3,
          mm_pay_transaction_step: 3,
        }),
      },
    );
  });

  it('sets mm_pay_dust_usd from the non-gas quote', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK, GAS_QUOTE_MOCK]);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_dust_usd: '0.5',
        }),
      },
    );
  });

  it('sets mm_pay_strategy to mm_swaps_bridge for Bridge quotes', () => {
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
          mm_pay_strategy: 'mm_swaps_bridge',
        }),
      },
    );
  });

  it('sets mm_pay_strategy to relay for Relay quotes', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    const relayQuote = {
      ...QUOTE_MOCK,
      strategy: TransactionPayStrategy.Relay,
    } as TransactionPayQuote<Json>;

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

  it('sets mm_pay_network_fee_usd and mm_pay_provider_fee_usd from totals', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayQuotesMock.mockReturnValue([QUOTE_MOCK]);
    useTransactionPayTotalsMock.mockReturnValue(TOTALS_MOCK);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          mm_pay_network_fee_usd: '0.15',
          mm_pay_provider_fee_usd: '0.25',
        }),
      },
    );
  });

  it('sets simulation_sending_assets_total_value for perpsDeposit transactions', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue({
      amountHuman: '42.5',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.perpsDeposit),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          simulation_sending_assets_total_value: 42.5,
        }),
      },
    );
  });

  it('sets simulation_sending_assets_total_value for musdConversion transactions', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue({
      amountHuman: '100',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.musdConversion),
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID_MOCK,
      {
        properties: expect.objectContaining({
          simulation_sending_assets_total_value: 100,
        }),
      },
    );
  });

  it('does not set simulation_sending_assets_total_value for non-pay transaction types', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue({
      amountHuman: '50',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    renderHook(() => useTransactionPayMetrics(), {
      wrapper: createWrapper(TransactionType.contractInteraction),
    });

    const call = jest.mocked(upsertTransactionUIMetricsFragment).mock.calls[0];
    const { properties } = call[1] as { properties: Record<string, unknown> };

    expect(properties).not.toHaveProperty(
      'simulation_sending_assets_total_value',
    );
  });
});
