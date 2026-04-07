import { renderHook, act } from '@testing-library/react-hooks';
import type { OrderFill } from '@metamask/perps-controller';
import { usePerpsMarketFills } from './usePerpsMarketFills';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_CONSTANTS: {
    FillsLookbackMs: 90 * 24 * 60 * 60 * 1000,
  },
}));

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockUsePerpsLiveFills = jest.fn();

jest.mock('./stream/usePerpsLiveFills', () => ({
  usePerpsLiveFills: (...args: unknown[]) => mockUsePerpsLiveFills(...args),
}));

const mockGetSelectedInternalAccount = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: (...args: unknown[]) => unknown) =>
    selector(),
  ),
}));

jest.mock('../../selectors/accounts', () => ({
  getSelectedInternalAccount: () => mockGetSelectedInternalAccount(),
}));

const baseFill = {
  side: 'buy',
  pnl: '0',
  fee: '5',
  feeToken: 'USDC',
  direction: 'Open Long',
} as const;

function makeFill(overrides: Partial<OrderFill> = {}): OrderFill {
  return {
    ...baseFill,
    orderId: 'order-001',
    symbol: 'BTC',
    size: '1.0',
    price: '50000',
    timestamp: 1000,
    ...overrides,
  } as OrderFill;
}

describe('usePerpsMarketFills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsLiveFills.mockReturnValue({
      fills: [],
      isInitialLoading: false,
    });
    mockGetSelectedInternalAccount.mockReturnValue({ address: '0xabc' });
    mockSubmitRequestToBackground.mockResolvedValue([]);
  });

  describe('initialization', () => {
    it('returns empty fills and not loading when no data', () => {
      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      expect(result.current.fills).toEqual([]);
      expect(result.current.isInitialLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
      expect(typeof result.current.refresh).toBe('function');
    });

    it('forwards isInitialLoading from usePerpsLiveFills', () => {
      mockUsePerpsLiveFills.mockReturnValue({
        fills: [],
        isInitialLoading: true,
      });

      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      expect(result.current.isInitialLoading).toBe(true);
    });
  });

  describe('REST fetching', () => {
    it('calls perpsGetOrderFills on mount', async () => {
      const restFills = [makeFill({ orderId: 'rest-1', timestamp: 2000 })];
      mockSubmitRequestToBackground.mockResolvedValue(restFills);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetOrderFills',
        [{ aggregateByTime: false, startTime: expect.any(Number) }],
      );
      expect(result.current.fills).toHaveLength(1);
      expect(result.current.fills[0].orderId).toBe('rest-1');
    });

    it('handles REST API errors gracefully', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network error'),
      );

      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      // Should not throw and fills should remain empty
      expect(result.current.fills).toEqual([]);
    });

    it('handles non-array REST response', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(null);

      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fills).toEqual([]);
    });
  });

  describe('symbol filtering', () => {
    it('filters REST fills by symbol', async () => {
      const restFills = [
        makeFill({ orderId: 'btc-1', symbol: 'BTC', timestamp: 3000 }),
        makeFill({ orderId: 'eth-1', symbol: 'ETH', timestamp: 2000 }),
        makeFill({ orderId: 'btc-2', symbol: 'BTC', timestamp: 1000 }),
      ];
      mockSubmitRequestToBackground.mockResolvedValue(restFills);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(2);
      expect(result.current.fills.every((f) => f.symbol === 'BTC')).toBe(true);
    });

    it('filters live fills by symbol', () => {
      mockUsePerpsLiveFills.mockReturnValue({
        fills: [
          makeFill({ orderId: 'live-btc', symbol: 'BTC', timestamp: 5000 }),
          makeFill({ orderId: 'live-eth', symbol: 'ETH', timestamp: 4000 }),
        ],
        isInitialLoading: false,
      });

      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      expect(result.current.fills).toHaveLength(1);
      expect(result.current.fills[0].orderId).toBe('live-btc');
    });

    it('returns empty when no fills match the symbol', async () => {
      const restFills = [
        makeFill({ orderId: 'eth-1', symbol: 'ETH', timestamp: 1000 }),
      ];
      mockSubmitRequestToBackground.mockResolvedValue(restFills);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'SOL' }),
      );

      await waitForNextUpdate();

      expect(result.current.fills).toEqual([]);
    });
  });

  describe('merging and deduplication', () => {
    it('merges REST and live fills', async () => {
      const restFills = [
        makeFill({ orderId: 'rest-1', symbol: 'BTC', timestamp: 1000 }),
      ];
      mockSubmitRequestToBackground.mockResolvedValue(restFills);
      mockUsePerpsLiveFills.mockReturnValue({
        fills: [
          makeFill({ orderId: 'live-1', symbol: 'BTC', timestamp: 2000 }),
        ],
        isInitialLoading: false,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(2);
    });

    it('deduplicates fills with same orderId/timestamp/size/price', async () => {
      const sharedProps = {
        orderId: 'dup-1',
        symbol: 'BTC',
        size: '1.0',
        price: '50000',
        timestamp: 1000,
      };

      const restFills = [makeFill(sharedProps)];
      mockSubmitRequestToBackground.mockResolvedValue(restFills);
      mockUsePerpsLiveFills.mockReturnValue({
        fills: [makeFill(sharedProps)],
        isInitialLoading: false,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(1);
    });

    it('live fills overwrite REST fills with same key (fresher data)', async () => {
      const sharedProps = {
        orderId: 'dup-1',
        symbol: 'BTC',
        size: '1.0',
        price: '50000',
        timestamp: 1000,
      };

      const restFill = makeFill({ ...sharedProps, pnl: '0' });
      const liveFill = makeFill({ ...sharedProps, pnl: '100' });

      mockSubmitRequestToBackground.mockResolvedValue([restFill]);
      mockUsePerpsLiveFills.mockReturnValue({
        fills: [liveFill],
        isInitialLoading: false,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(1);
      expect(result.current.fills[0].pnl).toBe('100');
    });
  });

  describe('sorting', () => {
    it('sorts fills by timestamp descending (newest first)', async () => {
      const restFills = [
        makeFill({ orderId: 'old', symbol: 'BTC', timestamp: 1000 }),
        makeFill({ orderId: 'newest', symbol: 'BTC', timestamp: 3000 }),
        makeFill({ orderId: 'mid', symbol: 'BTC', timestamp: 2000 }),
      ];
      mockSubmitRequestToBackground.mockResolvedValue(restFills);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      const timestamps = result.current.fills.map((f) => f.timestamp);
      expect(timestamps).toEqual([3000, 2000, 1000]);
    });
  });

  describe('refresh', () => {
    it('sets isRefreshing during manual refresh', async () => {
      let resolveRefresh: ((v: OrderFill[]) => void) | undefined;
      const pendingPromise = new Promise<OrderFill[]>((resolve) => {
        resolveRefresh = resolve;
      });
      mockSubmitRequestToBackground.mockReturnValue(pendingPromise);

      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      let refreshPromise: Promise<void> | undefined;
      act(() => {
        refreshPromise = result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        if (resolveRefresh) {
          resolveRefresh([]);
        }
        await refreshPromise;
      });

      expect(result.current.isRefreshing).toBe(false);
    });

    it('resets isRefreshing on error', async () => {
      // First call resolves (initial fetch), second rejects (refresh)
      mockSubmitRequestToBackground
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Refresh failed'));

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(false);
    });
  });

  describe('account switching', () => {
    it('clears REST fills and re-fetches when account changes', async () => {
      const accountAFills = [
        makeFill({ orderId: 'a-1', symbol: 'BTC', timestamp: 1000 }),
      ];
      const accountBFills = [
        makeFill({ orderId: 'b-1', symbol: 'BTC', timestamp: 2000 }),
      ];
      mockSubmitRequestToBackground.mockResolvedValue(accountAFills);

      const { result, waitForNextUpdate, rerender } = renderHook(
        ({ address }: { address: string }) => {
          mockGetSelectedInternalAccount.mockReturnValue({ address });
          return usePerpsMarketFills({ symbol: 'BTC' });
        },
        { initialProps: { address: '0xaaa' } },
      );

      await waitForNextUpdate();
      expect(result.current.fills[0].orderId).toBe('a-1');

      mockSubmitRequestToBackground.mockResolvedValue(accountBFills);
      rerender({ address: '0xbbb' });

      await waitForNextUpdate();
      expect(result.current.fills[0].orderId).toBe('b-1');
      // Should have been called at least twice (initial + account change)
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });
  });
});
