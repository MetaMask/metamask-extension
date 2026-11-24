import { renderHook } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { useCandle24hChange } from './useCandle24hChange';

jest.mock('../../hooks/useHistoricalPrices');

const mockUseHistoricalPrices = jest.mocked(useHistoricalPrices);

// P1D series opens at 100 (price ~24h ago) and most recently reads 120.
const PRICES = [
  { x: 1_699_000_000_000, y: 100 },
  { x: 1_699_086_400_000, y: 120 },
];

function setupHistorical(
  overrides: Partial<ReturnType<typeof useHistoricalPrices>> = {},
) {
  mockUseHistoricalPrices.mockReturnValue({
    data: { prices: PRICES, metadata: {} },
    loading: false,
    isFetching: false,
    isFetchedAfterMount: true,
    isPlaceholderData: false,
    ...overrides,
  } as ReturnType<typeof useHistoricalPrices>);
}

const BASE_OPTIONS = {
  chainId: '0x1' as Hex,
  address: '0x0000000000000000000000000000000000000000',
  currency: 'EUR',
  candlePrice: 150,
  candleCurrency: 'eur',
  currentPrice: 200,
  enabled: true,
};

function render(overrides: Partial<typeof BASE_OPTIONS> = {}) {
  return renderHook(() =>
    useCandle24hChange({ ...BASE_OPTIONS, ...overrides }),
  );
}

describe('useCandle24hChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupHistorical();
  });

  it('fetches the interval-independent P1D series', () => {
    render();

    expect(mockUseHistoricalPrices).toHaveBeenCalledWith(
      expect.objectContaining({ timeRange: 'P1D', enabled: true }),
    );
  });

  it('uses the live candle price against the P1D open when currencies match', () => {
    // (150 - 100) / 100 = +50%.
    const { result } = render({ candleCurrency: 'eur', currency: 'EUR' });

    expect(result.current.percentChange).toBe(50);
  });

  it('does not mix currencies: uses a currency-denominated price when the candle resolved to another fiat', () => {
    // Candle is USD but the user currency is EUR, so the USD candle price must
    // not be compared to the EUR baseline. Uses currentPrice (200) vs 100.
    const { result } = render({
      candleCurrency: 'usd',
      currency: 'EUR',
      candlePrice: 150,
      currentPrice: 200,
    });

    expect(result.current.percentChange).toBe(100);
  });

  it('falls back to the latest P1D point when the candle resolved to another fiat and there is no current price', () => {
    // (120 - 100) / 100 = +20%.
    const { result } = render({
      candleCurrency: 'usd',
      currency: 'EUR',
      currentPrice: undefined,
    });

    expect(result.current.percentChange).toBe(20);
  });

  it('returns no percentage while the historical data is placeholder', () => {
    setupHistorical({ isPlaceholderData: true });

    const { result } = render();

    expect(result.current.percentChange).toBeUndefined();
    expect(result.current.loading).toBe(true);
  });

  it('keeps the query idle in line mode', () => {
    render({ enabled: false });

    expect(mockUseHistoricalPrices).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
