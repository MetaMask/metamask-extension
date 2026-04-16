import { renderHook } from '@testing-library/react-hooks';
import type { PriceUpdate } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsLivePrices } from './usePerpsLivePrices';

type StreamPriceUpdate = PriceUpdate & {
  timestamp?: number;
  markPrice?: string;
};

jest.mock('./usePerpsChannel', () => ({
  usePerpsChannel: jest.fn(),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockUsePerpsChannel = usePerpsChannel as jest.MockedFunction<
  typeof usePerpsChannel
>;
const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

describe('usePerpsLivePrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('filters by requested symbols and keeps provided timestamp/markPrice', () => {
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
      data: [{ symbol: 'BTC', price: '100' }] as StreamPriceUpdate[],
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

  it('activates and deactivates the background price stream when requested', () => {
    mockUsePerpsChannel.mockReturnValue({
      data: [],
      isInitialLoading: false,
    });

    const { unmount } = renderHook(() =>
      usePerpsLivePrices({
        symbols: ['ETH', 'BTC'],
        activateStream: true,
        includeMarketData: true,
      }),
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsActivatePriceStream',
      [{ symbols: ['BTC', 'ETH'], includeMarketData: true }],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDeactivatePriceStream',
      [],
    );
  });

  it('logs debug output when stream activation or cleanup fails', async () => {
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

    expect(debugSpy).toHaveBeenCalledWith(
      '[usePerpsLivePrices] perpsActivatePriceStream failed:',
      expect.any(Error),
    );

    unmount();
    await Promise.resolve();

    expect(debugSpy).toHaveBeenCalledWith(
      '[usePerpsLivePrices] perpsDeactivatePriceStream failed:',
      expect.any(Error),
    );

    debugSpy.mockRestore();
  });
});
