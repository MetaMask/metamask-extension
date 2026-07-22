import { act, renderHook } from '@testing-library/react-hooks';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsLiveOrderBook } from './usePerpsLiveOrderBook';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('./usePerpsChannel', () => ({
  usePerpsChannel: jest.fn(),
}));

const mockUsePerpsChannel = jest.mocked(usePerpsChannel);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('usePerpsLiveOrderBook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockUsePerpsChannel.mockReturnValue({
      data: null,
      isInitialLoading: false,
    });
  });

  it('activates and deactivates the background order-book stream by default', () => {
    const { unmount } = renderHook(() =>
      usePerpsLiveOrderBook({ symbol: 'BTC', levels: 10 }),
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsActivateOrderBookStream',
      [{ symbol: 'BTC', levels: 10, nSigFigs: undefined, mantissa: undefined }],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDeactivateOrderBookStream',
      [],
    );
  });

  it('does not manage the stream when manageStream is false', () => {
    const { rerender, unmount } = renderHook(
      ({ enabled }) =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          enabled,
          manageStream: false,
        }),
      { initialProps: { enabled: true } },
    );

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

    rerender({ enabled: false });
    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('marks initial loading when disabled', () => {
    mockUsePerpsChannel.mockReturnValue({
      data: null,
      isInitialLoading: false,
    });

    const { result } = renderHook(() =>
      usePerpsLiveOrderBook({ symbol: 'BTC', enabled: false }),
    );

    expect(result.current.isInitialLoading).toBe(true);
  });

  describe('aggregated channel', () => {
    it('activates and deactivates the aggregated stream with nSigFigs/mantissa', () => {
      const { unmount } = renderHook(() =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          channel: 'orderBookAggregated',
          levels: 20,
          nSigFigs: 3,
          mantissa: 5,
        }),
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateOrderBookAggregatedStream',
        [{ symbol: 'BTC', levels: 20, nSigFigs: 3, mantissa: 5 }],
      );

      unmount();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateOrderBookAggregatedStream',
        [],
      );
    });

    it('reads from the orderBookAggregated channel', () => {
      const orderBookAggregated = { name: 'aggregated' };
      const orderBook = { name: 'raw' };
      const streamManager = { orderBook, orderBookAggregated };

      renderHook(() =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          channel: 'orderBookAggregated',
          nSigFigs: 4,
        }),
      );

      const getChannel = mockUsePerpsChannel.mock.calls[0][0];
      expect(getChannel(streamManager as never)).toBe(orderBookAggregated);
    });

    it('folds aggregation params into the reset key so grouping changes drop stale rows', () => {
      renderHook(() =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          channel: 'orderBookAggregated',
          nSigFigs: 3,
          mantissa: 2,
        }),
      );

      const resetKey = mockUsePerpsChannel.mock.calls[0][2];
      // Trailing `:0` is the reconnect nonce (bumped by reconnect()).
      expect(resetKey).toBe('BTC:3:2:0');
    });

    it('keeps the raw channel reset key symbol-only', () => {
      renderHook(() => usePerpsLiveOrderBook({ symbol: 'BTC', nSigFigs: 3 }));

      const resetKey = mockUsePerpsChannel.mock.calls[0][2];
      expect(resetKey).toBe('BTC');
    });

    it('reads status from the orderBookAggregatedStatus channel', () => {
      const orderBookAggregated = { name: 'aggregated' };
      const orderBookAggregatedStatus = { name: 'status' };
      const streamManager = { orderBookAggregated, orderBookAggregatedStatus };

      renderHook(() =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          channel: 'orderBookAggregated',
          nSigFigs: 4,
        }),
      );

      // Second usePerpsChannel call reads the status channel.
      const getStatusChannel = mockUsePerpsChannel.mock.calls[1][0];
      expect(getStatusChannel(streamManager as never)).toBe(
        orderBookAggregatedStatus,
      );
    });

    it('re-subscribes when reconnect() is called', () => {
      const { result } = renderHook(() =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          channel: 'orderBookAggregated',
          nSigFigs: 3,
        }),
      );

      mockSubmitRequestToBackground.mockClear();

      act(() => {
        result.current.reconnect();
      });

      // The prior subscription is torn down and a fresh one is activated,
      // which rebuilds the dedicated socket in the background.
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateOrderBookAggregatedStream',
        [],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateOrderBookAggregatedStream',
        [
          {
            symbol: 'BTC',
            levels: undefined,
            nSigFigs: 3,
            mantissa: undefined,
          },
        ],
      );
    });
  });
});
