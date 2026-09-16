import type { PriceUpdate } from '@metamask/perps-controller';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { submitRequestToBackground } from '../../../store/background-connection';
import { selectEvmAddress, getUseExternalServices } from '../../../selectors';
import { getIsPerpsExperienceAvailable } from '../../../selectors/perps';
import { usePerpsStreamManager } from './usePerpsStreamManager';
import { usePerpsLivePrices } from './usePerpsLivePrices';

type StreamPriceUpdate = {
  symbol: string;
  price: string;
  timestamp?: number;
  markPrice?: string;
  percentChange24h?: string;
};

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('./usePerpsStreamManager');
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

const manager = getPerpsStreamManager();
const mockUsePerpsStreamManager = jest.mocked(usePerpsStreamManager);
function setPrices({
  data,
  isInitialLoading,
}: {
  data: StreamPriceUpdate[];
  isInitialLoading: boolean;
}) {
  act(() => manager.prices.pushData(data as PriceUpdate[]));
  mockUsePerpsStreamManager.mockReturnValue({
    streamManager: manager,
    isInitializing: isInitialLoading,
    error: null,
    selectedAddress: '0xfirst',
  });
}
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('usePerpsLivePrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsStreamManager.mockReset();
    manager.clearAllCaches();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('reports readiness only for a live price belonging to the requested symbols', () => {
    manager.clearAllCaches();
    manager.handleBackgroundUpdate({
      channel: 'prices',
      data: [{ symbol: 'ETH', price: '2000' }],
    });
    setPrices({
      data: manager.prices.getCachedData(),
      isInitialLoading: false,
    });
    const { result, rerender } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );
    expect(result.current.isLive).toBe(false);

    act(() =>
      manager.handleBackgroundUpdate({
        channel: 'prices',
        data: [{ symbol: 'BTC', price: '50000' }],
      }),
    );
    setPrices({
      data: manager.prices.getCachedData(),
      isInitialLoading: false,
    });
    rerender();

    expect(result.current.isLive).toBe(true);
    manager.clearAllCaches();
  });

  it('returns empty prices while initial loading is true', () => {
    const priceUpdates: StreamPriceUpdate[] = [{ symbol: 'BTC', price: '100' }];
    setPrices({
      data: priceUpdates,
      isInitialLoading: true,
    });

    const { result } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );

    expect(result.current).toEqual({
      isLive: false,
      prices: {},
      isInitialLoading: true,
    });
  });

  it('returns empty prices when channel has no data', () => {
    setPrices({
      data: [],
      isInitialLoading: false,
    });

    const { result } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );

    expect(result.current).toEqual({
      isLive: false,
      prices: {},
      isInitialLoading: false,
    });
  });

  it('filters by requested symbols and keeps provided timestamp and markPrice', () => {
    const priceUpdates: StreamPriceUpdate[] = [
      {
        symbol: 'BTC',
        price: '100',
        timestamp: 111,
        markPrice: '101',
        percentChange24h: '+3.1%',
      },
      {
        symbol: 'ETH',
        price: '200',
        timestamp: 222,
        markPrice: '201',
      },
    ];

    setPrices({
      data: priceUpdates,
      isInitialLoading: false,
    });

    const { result } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.prices).toEqual({
      BTC: {
        symbol: 'BTC',
        price: '100',
        timestamp: 111,
        markPrice: '101',
        percentChange24h: '+3.1%',
      },
    });
  });

  it('uses fallback timestamp and preserves missing markPrice', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(999);
    setPrices({
      data: [{ symbol: 'BTC', price: '100' }],
      isInitialLoading: false,
    });

    const { result } = renderHook(() => usePerpsLivePrices({ symbols: [] }));

    expect(result.current.prices).toEqual({
      BTC: {
        symbol: 'BTC',
        price: '100',
        timestamp: 999,
        markPrice: undefined,
      },
    });

    nowSpy.mockRestore();
  });

  it('returns a stable prices reference when inputs are unchanged', () => {
    const priceUpdates: StreamPriceUpdate[] = [
      {
        symbol: 'BTC',
        price: '100',
        timestamp: 111,
      },
    ];

    setPrices({
      data: priceUpdates,
      isInitialLoading: false,
    });

    const { result, rerender } = renderHook(
      ({ symbols }) => usePerpsLivePrices({ symbols }),
      {
        initialProps: { symbols: ['BTC'] },
      },
    );

    const firstPrices = result.current.prices;

    rerender({ symbols: ['BTC'] });

    expect(result.current.prices).toBe(firstPrices);
  });

  it('does not render a requested symbol for unrelated broad price updates', () => {
    setPrices({ data: [], isInitialLoading: false });
    manager.handleBackgroundUpdate({
      channel: 'prices',
      data: [
        { symbol: 'BTC', price: '100', timestamp: 1 },
        { symbol: 'ETH', price: '200', timestamp: 1 },
      ],
    });
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return usePerpsLivePrices({ symbols: ['BTC'] });
    });
    const before = renders;
    const { prices } = result.current;
    act(() =>
      manager.handleBackgroundUpdate({
        channel: 'prices',
        data: [{ symbol: 'ETH', price: '201', timestamp: 2 }],
      }),
    );
    expect(renders).toBe(before);
    expect(result.current.prices).toBe(prices);
    expect(result.current.isLive).toBe(true);
    act(() =>
      manager.handleBackgroundUpdate({
        channel: 'prices',
        data: [{ symbol: 'BTC', price: '101', timestamp: 2 }],
      }),
    );
    expect(renders).toBe(before + 1);
    expect(result.current.prices.BTC.price).toBe('101');
  });

  it('selects a different symbol from cache without waiting for another update', () => {
    setPrices({
      data: [
        { symbol: 'BTC', price: '100' },
        { symbol: 'ETH', price: '200' },
      ],
      isInitialLoading: false,
    });
    const { result, rerender } = renderHook(
      ({ symbols }) => usePerpsLivePrices({ symbols }),
      { initialProps: { symbols: ['BTC'] } },
    );
    rerender({ symbols: ['ETH'] });
    expect(Object.keys(result.current.prices)).toEqual(['ETH']);
    expect(result.current.prices.ETH.price).toBe('200');
  });

  it('clears the previous account while unavailable and accepts the next cache', () => {
    setPrices({
      data: [{ symbol: 'BTC', price: '100' }],
      isInitialLoading: false,
    });
    const { result, rerender } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );
    setPrices({ data: manager.prices.getCachedData(), isInitialLoading: true });
    rerender();
    expect(result.current).toEqual({
      prices: {},
      isInitialLoading: true,
      isLive: false,
    });
    setPrices({
      data: [{ symbol: 'BTC', price: '200' }],
      isInitialLoading: false,
    });
    rerender();
    expect(result.current.prices.BTC.price).toBe('200');
    expect(result.current.isInitialLoading).toBe(false);
  });

  it('publishes live readiness even when the first live price equals the seed', () => {
    const price = { symbol: 'BTC', price: '100', timestamp: 1 };
    setPrices({ data: [price], isInitialLoading: false });
    const { result } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );
    expect(result.current.isLive).toBe(false);
    act(() =>
      manager.handleBackgroundUpdate({
        channel: 'prices',
        data: [{ ...price }],
      }),
    );
    expect(result.current.isLive).toBe(true);
    const snapshot = result.current;
    act(() =>
      manager.handleBackgroundUpdate({
        channel: 'prices',
        data: [{ ...price }],
      }),
    );
    expect(result.current).toBe(snapshot);
    act(() =>
      manager.handleBackgroundUpdate({
        channel: 'prices',
        data: [{ ...price, markPrice: '101' }],
      }),
    );
    expect(result.current.prices.BTC.markPrice).toBe('101');
  });

  it('activates and deactivates the background price stream when requested', () => {
    setPrices({
      data: [],
      isInitialLoading: false,
    });

    const { unmount } = renderHook(() =>
      usePerpsLivePrices({
        symbols: ['ETH', 'BTC', 'ETH'],
        activateStream: true,
        includeMarketData: false,
      }),
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsActivatePriceStream',
      [{ symbols: ['BTC', 'ETH'], includeMarketData: false }],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDeactivatePriceStream',
      [],
    );
  });

  it('activates a mounted consumer after account recovery completes', async () => {
    const actual = jest.requireActual<typeof import('./usePerpsStreamManager')>(
      './usePerpsStreamManager',
    );
    mockUsePerpsStreamManager.mockImplementation(actual.usePerpsStreamManager);
    jest.mocked(useSelector).mockImplementation((selector) => {
      if (selector === selectEvmAddress) {
        return '0xrecovering';
      }
      if (
        selector === getUseExternalServices ||
        selector === getIsPerpsExperienceAvailable
      ) {
        return true;
      }
      return undefined;
    });
    let finishRecovery: () => void = () => undefined;
    const recovery = new Promise<void>((resolve) => {
      finishRecovery = resolve;
    });
    let recovered = false;
    mockSubmitRequestToBackground.mockImplementation(async (method) => {
      if (method === 'perpsInitForAccount') {
        await recovery;
        recovered = true;
      }
      if (method === 'perpsActivatePriceStream') {
        if (!recovered) {
          throw new Error('Perps account initialization required');
        }
        manager.handleBackgroundUpdate({
          channel: 'prices',
          data: [{ symbol: 'BTC', price: '123', timestamp: 1 }],
        });
      }
      return undefined;
    });
    const { result, unmount } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'], activateStream: true }),
    );
    await waitFor(() =>
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsInitForAccount',
        ['0xrecovering'],
      ),
    );
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsActivatePriceStream',
      expect.anything(),
    );
    await act(async () => finishRecovery());
    await waitFor(() => expect(result.current.prices.BTC?.price).toBe('123'));
    expect(result.current.isLive).toBe(true);
    expect(
      mockSubmitRequestToBackground.mock.calls.filter(
        ([method]) => method === 'perpsActivatePriceStream',
      ),
    ).toHaveLength(1);
    unmount();
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDeactivatePriceStream',
      [],
    );
  });

  it('logs activation and cleanup failures without throwing', async () => {
    const debugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    setPrices({
      data: [],
      isInitialLoading: false,
    });
    mockSubmitRequestToBackground
      .mockRejectedValueOnce(new Error('activate failed'))
      .mockRejectedValueOnce(new Error('deactivate failed'));

    const { unmount } = renderHook(() =>
      usePerpsLivePrices({
        symbols: ['BTC'],
        activateStream: true,
      }),
    );

    await Promise.resolve();
    unmount();
    await Promise.resolve();

    expect(debugSpy).toHaveBeenCalledWith(
      '[usePerpsLivePrices] perpsActivatePriceStream failed:',
      expect.any(Error),
    );
    expect(debugSpy).toHaveBeenCalledWith(
      '[usePerpsLivePrices] perpsDeactivatePriceStream failed:',
      expect.any(Error),
    );

    debugSpy.mockRestore();
  });
});
