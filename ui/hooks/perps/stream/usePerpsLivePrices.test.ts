import { renderHook } from '@testing-library/react-hooks';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';
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

jest.mock('./usePerpsChannel', () => ({
  usePerpsChannel: jest.fn(),
}));

const mockUsePerpsChannel = jest.mocked(usePerpsChannel);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('usePerpsLivePrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('returns empty prices while initial loading is true', () => {
    const priceUpdates: StreamPriceUpdate[] = [{ symbol: 'BTC', price: '100' }];
    mockUsePerpsChannel.mockReturnValue({
      data: priceUpdates,
      isInitialLoading: true,
    });

    const { result } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );

    expect(result.current).toEqual({
      prices: {},
      isInitialLoading: true,
    });
  });

  it('returns empty prices when channel has no data', () => {
    mockUsePerpsChannel.mockReturnValue({
      data: [],
      isInitialLoading: false,
    });

    const { result } = renderHook(() =>
      usePerpsLivePrices({ symbols: ['BTC'] }),
    );

    expect(result.current).toEqual({
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

    mockUsePerpsChannel.mockReturnValue({
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
    mockUsePerpsChannel.mockReturnValue({
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

    mockUsePerpsChannel.mockReturnValue({
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

  it('activates and deactivates the background price stream when requested', () => {
    mockUsePerpsChannel.mockReturnValue({
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

  it('logs activation and cleanup failures without throwing', async () => {
    const debugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    mockUsePerpsChannel.mockReturnValue({
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
