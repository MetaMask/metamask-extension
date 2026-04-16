import { renderHook, act } from '@testing-library/react-hooks';
import type { OrderFill } from '@metamask/perps-controller';
import { usePerpsMarketFills } from './usePerpsMarketFills';

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

function makeFill(overrides: Partial<OrderFill> = {}): OrderFill {
  return {
    orderId: 'order-001',
    symbol: 'BTC',
    side: 'buy',
    size: '1.0',
    price: '50000',
    pnl: '0',
    fee: '5',
    feeToken: 'USDC',
    direction: 'Open Long',
    timestamp: 1000,
    ...overrides,
  } as OrderFill;
}

function setLiveFills(fills: OrderFill[], isInitialLoading = false) {
  mockUsePerpsLiveFills.mockReturnValue({ fills, isInitialLoading });
}

function setRestFillsResponse(fills: OrderFill[] | null) {
  mockSubmitRequestToBackground.mockResolvedValue(fills);
}

describe('usePerpsMarketFills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLiveFills([]);
    mockGetSelectedInternalAccount.mockReturnValue({ address: '0xabc' });
    setRestFillsResponse([]);
  });

  describe('initialization', () => {
    it('returns empty fills and not loading once REST resolves', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current).toEqual(
        expect.objectContaining({
          fills: [],
          isInitialLoading: false,
        }),
      );
    });

    it('reports isInitialLoading while REST fetch is still in-flight', () => {
      setLiveFills([], false);
      mockSubmitRequestToBackground.mockReturnValue(
        // Intentionally never-resolving promise to simulate in-flight request
        new Promise(() => undefined),
      );

      const { result } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      expect(result.current.isInitialLoading).toBe(true);
    });

    it('reports isInitialLoading when WebSocket is still loading', async () => {
      setLiveFills([], true);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.isInitialLoading).toBe(true);
    });

    it('clears isInitialLoading once both WebSocket and REST complete', async () => {
      setLiveFills([], false);
      setRestFillsResponse([]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );

      expect(result.current.isInitialLoading).toBe(true);
      await waitForNextUpdate();
      expect(result.current.isInitialLoading).toBe(false);
    });
  });

  describe('REST fetching', () => {
    it('fetches fills via perpsGetOrderFills on mount', async () => {
      setRestFillsResponse([makeFill({ orderId: 'rest-1', timestamp: 2000 })]);

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

    it('keeps fills empty when REST API returns an error', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network error'),
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toEqual([]);
      expect(result.current.isInitialLoading).toBe(false);
    });

    it('keeps fills empty when REST API returns null', async () => {
      setRestFillsResponse(null);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toEqual([]);
    });
  });

  describe('symbol filtering', () => {
    it('only includes REST fills matching the requested symbol', async () => {
      setRestFillsResponse([
        makeFill({ orderId: 'btc-1', symbol: 'BTC', timestamp: 3000 }),
        makeFill({ orderId: 'eth-1', symbol: 'ETH', timestamp: 2000 }),
        makeFill({ orderId: 'btc-2', symbol: 'BTC', timestamp: 1000 }),
      ]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(2);
      expect(result.current.fills.every((f) => f.symbol === 'BTC')).toBe(true);
    });

    it('only includes live fills matching the requested symbol', async () => {
      setLiveFills([
        makeFill({ orderId: 'live-btc', symbol: 'BTC', timestamp: 5000 }),
        makeFill({ orderId: 'live-eth', symbol: 'ETH', timestamp: 4000 }),
      ]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(1);
      expect(result.current.fills[0].orderId).toBe('live-btc');
    });

    it('returns empty when no fills match the symbol', async () => {
      setRestFillsResponse([
        makeFill({ orderId: 'eth-1', symbol: 'ETH', timestamp: 1000 }),
      ]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'SOL' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toEqual([]);
    });
  });

  describe('merging and deduplication', () => {
    it('includes fills from both REST and live sources', async () => {
      setRestFillsResponse([makeFill({ orderId: 'rest-1', timestamp: 1000 })]);
      setLiveFills([makeFill({ orderId: 'live-1', timestamp: 2000 })]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(2);
    });

    it('deduplicates fills sharing orderId/timestamp/size/price', async () => {
      const shared = {
        orderId: 'dup-1',
        size: '1.0',
        price: '50000',
        timestamp: 1000,
      };

      setRestFillsResponse([makeFill(shared)]);
      setLiveFills([makeFill(shared)]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(1);
    });

    it('prefers live fill data over REST for the same dedup key', async () => {
      const shared = {
        orderId: 'dup-1',
        size: '1.0',
        price: '50000',
        timestamp: 1000,
      };

      setRestFillsResponse([makeFill({ ...shared, pnl: '0' })]);
      setLiveFills([makeFill({ ...shared, pnl: '100' })]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills).toHaveLength(1);
      expect(result.current.fills[0].pnl).toBe('100');
    });
  });

  describe('sorting', () => {
    it('returns fills sorted by timestamp descending', async () => {
      setRestFillsResponse([
        makeFill({ orderId: 'old', timestamp: 1000 }),
        makeFill({ orderId: 'newest', timestamp: 3000 }),
        makeFill({ orderId: 'mid', timestamp: 2000 }),
      ]);

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsMarketFills({ symbol: 'BTC' }),
      );
      await waitForNextUpdate();

      expect(result.current.fills.map((f) => f.timestamp)).toEqual([
        3000, 2000, 1000,
      ]);
    });
  });

  describe('account switching', () => {
    it('clears stale fills and re-fetches for the new account', async () => {
      setRestFillsResponse([makeFill({ orderId: 'a-1', timestamp: 1000 })]);

      const { result, waitForNextUpdate, rerender } = renderHook(
        ({ address }: { address: string }) => {
          mockGetSelectedInternalAccount.mockReturnValue({ address });
          return usePerpsMarketFills({ symbol: 'BTC' });
        },
        { initialProps: { address: '0xaaa' } },
      );
      await waitForNextUpdate();
      expect(result.current.fills[0].orderId).toBe('a-1');

      setRestFillsResponse([makeFill({ orderId: 'b-1', timestamp: 2000 })]);
      rerender({ address: '0xbbb' });
      await waitForNextUpdate();

      expect(result.current.fills[0].orderId).toBe('b-1');
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });

    it('discards stale REST response when account changes before fetch completes', async () => {
      let resolveFirstFetch!: (v: OrderFill[]) => void;
      mockSubmitRequestToBackground.mockReturnValueOnce(
        new Promise<OrderFill[]>((resolve) => {
          resolveFirstFetch = resolve;
        }),
      );

      const { result, waitForNextUpdate, rerender } = renderHook(
        ({ address }: { address: string }) => {
          mockGetSelectedInternalAccount.mockReturnValue({ address });
          return usePerpsMarketFills({ symbol: 'BTC' });
        },
        { initialProps: { address: '0xaaa' } },
      );

      setRestFillsResponse([makeFill({ orderId: 'b-1', timestamp: 2000 })]);
      rerender({ address: '0xbbb' });
      await waitForNextUpdate();

      await act(async () => {
        resolveFirstFetch([makeFill({ orderId: 'stale-a', timestamp: 500 })]);
      });

      expect(result.current.fills).toHaveLength(1);
      expect(result.current.fills[0].orderId).toBe('b-1');
    });
  });
});
