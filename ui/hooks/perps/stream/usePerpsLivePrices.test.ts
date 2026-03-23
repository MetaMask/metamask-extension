import { renderHook } from '@testing-library/react-hooks';
import type { PriceUpdate } from '@metamask/perps-controller';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsLivePrices } from './usePerpsLivePrices';

jest.mock('./usePerpsChannel', () => ({
  usePerpsChannel: jest.fn(),
}));

const mockUsePerpsChannel = usePerpsChannel as jest.MockedFunction<
  typeof usePerpsChannel
>;

describe('usePerpsLivePrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty prices while initial loading is true', () => {
    const priceUpdates = [{ symbol: 'BTC', price: '100' }] as PriceUpdate[];
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
    const priceUpdates = [
      {
        symbol: 'BTC',
        price: '100',
        timestamp: 111,
        markPrice: '101',
      },
      {
        symbol: 'ETH',
        price: '200',
        timestamp: 222,
        markPrice: '201',
      },
    ] as PriceUpdate[];

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
      },
    });
  });

  it('uses fallback timestamp and markPrice when absent', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(999);
    mockUsePerpsChannel.mockReturnValue({
      data: [{ symbol: 'BTC', price: '100' }] as PriceUpdate[],
      isInitialLoading: false,
    });

    const { result } = renderHook(() => usePerpsLivePrices({ symbols: [] }));

    expect(result.current.prices).toEqual({
      BTC: {
        symbol: 'BTC',
        price: '100',
        timestamp: 999,
        markPrice: '100',
      },
    });

    nowSpy.mockRestore();
  });
});
