import { renderHook, act } from '@testing-library/react-hooks';
import type { Order, OrderFill, Funding } from '@metamask/perps-controller';
import { usePerpsTransactionHistory } from './usePerpsTransactionHistory';

// Mock responses
const mockFills: OrderFill[] = [
  {
    orderId: 'order-001',
    symbol: 'BTC',
    side: 'buy',
    size: '1.0',
    price: '50000',
    pnl: '0',
    direction: 'Open Long',
    fee: '10',
    feeToken: 'USDC',
    timestamp: Date.now() - 1000,
  },
];

const mockOrders: Order[] = [
  {
    orderId: 'order-002',
    symbol: 'ETH',
    side: 'buy',
    orderType: 'limit',
    size: '5.0',
    originalSize: '5.0',
    price: '3000',
    filledSize: '0',
    remainingSize: '5.0',
    status: 'open',
    timestamp: Date.now() - 2000,
  },
];

const mockFunding: Funding[] = [
  {
    symbol: 'BTC',
    amountUsd: '5.00',
    rate: '0.0001',
    timestamp: Date.now() - 3000,
  },
];

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

// Mock useUserHistory
jest.mock('./useUserHistory', () => ({
  useUserHistory: () => ({
    userHistory: [],
    isLoading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue([]),
  }),
}));

// Mock usePerpsLiveFills
jest.mock('./stream/usePerpsLiveFills', () => ({
  usePerpsLiveFills: () => ({
    fills: [],
    isInitialLoading: false,
  }),
}));

describe('usePerpsTransactionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: return appropriate data per method
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsGetOrderFills') {
        return Promise.resolve(mockFills);
      }
      if (method === 'perpsGetOrders') {
        return Promise.resolve(mockOrders);
      }
      if (method === 'perpsGetFunding') {
        return Promise.resolve(mockFunding);
      }
      return Promise.resolve(undefined);
    });
  });

  it('initializes with empty transactions', () => {
    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    expect(result.current.transactions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('fetches all transaction types on refetch', async () => {
    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetOrderFills',
      expect.anything(),
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetOrders',
      expect.anything(),
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetFunding',
      expect.anything(),
    );

    // Should have transactions from fills, orders, and funding
    expect(result.current.transactions.length).toBeGreaterThan(0);
  });

  it('sorts transactions by timestamp descending', async () => {
    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    const timestamps = result.current.transactions.map((tx) => tx.timestamp);
    const sortedTimestamps = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sortedTimestamps);
  });

  it('handles provider errors gracefully', async () => {
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsGetOrderFills') {
        return Promise.reject(new Error('API error'));
      }
      return Promise.resolve([]);
    });

    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('API error');
    expect(result.current.transactions).toEqual([]);
  });

  it('passes params to provider methods', async () => {
    const { result } = renderHook(() =>
      usePerpsTransactionHistory({
        skipInitialFetch: true,
        startTime: 1000,
        endTime: 2000,
        accountId: 'eip155:1:0xabc' as `${string}:${string}:${string}`,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetOrderFills',
      [{ accountId: 'eip155:1:0xabc', aggregateByTime: false }],
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetOrders',
      [{ accountId: 'eip155:1:0xabc' }],
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetFunding',
      [{ accountId: 'eip155:1:0xabc', startTime: 1000, endTime: 2000 }],
    );
  });

  it('enriches fills with detailedOrderType from orders', async () => {
    const fillWithOrderId: OrderFill[] = [
      {
        orderId: 'order-with-details',
        symbol: 'BTC',
        side: 'sell',
        size: '1.0',
        price: '51000',
        pnl: '1000',
        direction: 'Close Long',
        fee: '10',
        feeToken: 'USDC',
        timestamp: Date.now(),
      },
    ];

    const ordersWithDetails: Order[] = [
      {
        orderId: 'order-with-details',
        symbol: 'BTC',
        side: 'sell',
        orderType: 'limit',
        size: '0',
        originalSize: '1.0',
        price: '51000',
        filledSize: '1.0',
        remainingSize: '0',
        status: 'filled',
        timestamp: Date.now(),
        detailedOrderType: 'Take Profit Limit',
      },
    ];

    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsGetOrderFills') {
        return Promise.resolve(fillWithOrderId);
      }
      if (method === 'perpsGetOrders') {
        return Promise.resolve(ordersWithDetails);
      }
      return Promise.resolve([]);
    });

    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Find the trade transaction
    const tradeTx = result.current.transactions.find(
      (tx) => tx.type === 'trade',
    );

    // The fill should have the TakeProfit fillType
    expect(tradeTx?.fill?.fillType).toBe('take_profit');
  });

  it('removes duplicate transactions by ID', async () => {
    const duplicateFills: OrderFill[] = [
      {
        orderId: 'order-001',
        symbol: 'BTC',
        side: 'buy',
        size: '1.0',
        price: '50000',
        pnl: '0',
        direction: 'Open Long',
        fee: '10',
        feeToken: 'USDC',
        timestamp: 1000000000000,
      },
    ];

    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsGetOrderFills') {
        return Promise.resolve(duplicateFills);
      }
      return Promise.resolve([]);
    });

    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Should not have duplicate transactions
    const ids = result.current.transactions.map((tx) => tx.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});
