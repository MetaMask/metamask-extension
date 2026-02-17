import { renderHook, act } from '@testing-library/react-hooks';
import { usePerpsTransactionHistory } from './usePerpsTransactionHistory';
import type { Order, OrderFill, Funding } from '@metamask/perps-controller';

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

// Mock provider methods
const mockGetOrderFills = jest.fn();
const mockGetOrders = jest.fn();
const mockGetFunding = jest.fn();
const mockGetUserHistory = jest.fn();

const mockGetActiveProvider = jest.fn(() => ({
  getOrderFills: mockGetOrderFills,
  getOrders: mockGetOrders,
  getFunding: mockGetFunding,
  getUserHistory: mockGetUserHistory,
}));

const mockController = {
  getActiveProvider: mockGetActiveProvider,
  subscribeToOrderFills: jest.fn(() => jest.fn()),
};

jest.mock('../../providers/perps', () => ({
  usePerpsController: () => mockController,
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
    mockGetOrderFills.mockResolvedValue(mockFills);
    mockGetOrders.mockResolvedValue(mockOrders);
    mockGetFunding.mockResolvedValue(mockFunding);
    mockGetUserHistory.mockResolvedValue([]);
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

    // Should have called all provider methods
    expect(mockGetOrderFills).toHaveBeenCalled();
    expect(mockGetOrders).toHaveBeenCalled();
    expect(mockGetFunding).toHaveBeenCalled();

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
    mockGetOrderFills.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('API error');
    expect(result.current.transactions).toEqual([]);
  });

  it('handles missing provider gracefully', async () => {
    mockGetActiveProvider.mockReturnValueOnce(
      null as unknown as ReturnType<typeof mockGetActiveProvider>,
    );

    const { result } = renderHook(() =>
      usePerpsTransactionHistory({ skipInitialFetch: true }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('No active provider available');
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

    expect(mockGetOrderFills).toHaveBeenCalledWith({
      accountId: 'eip155:1:0xabc',
      aggregateByTime: false,
    });

    expect(mockGetOrders).toHaveBeenCalledWith({
      accountId: 'eip155:1:0xabc',
    });

    expect(mockGetFunding).toHaveBeenCalledWith({
      accountId: 'eip155:1:0xabc',
      startTime: 1000,
      endTime: 2000,
    });
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

    mockGetOrderFills.mockResolvedValue(fillWithOrderId);
    mockGetOrders.mockResolvedValue(ordersWithDetails);
    mockGetFunding.mockResolvedValue([]);

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
    // Create fills with same timestamp to potentially create duplicate IDs
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

    mockGetOrderFills.mockResolvedValue(duplicateFills);
    mockGetOrders.mockResolvedValue([]);
    mockGetFunding.mockResolvedValue([]);

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
