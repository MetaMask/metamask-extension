import { renderHook } from '@testing-library/react-hooks';
import { useSpotPricesQuery } from './useSpotPricesQuery';

const mockGetV3SpotPricesQueryOptions = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('../helpers/api-client', () => ({
  apiClient: {
    prices: {
      getV3SpotPricesQueryOptions: (...args: unknown[]) =>
        mockGetV3SpotPricesQueryOptions(...args),
    },
  },
}));

describe('useSpotPricesQuery', () => {
  const ASSET_IDS = ['eip155:1/slip44:60'];
  const MOCK_QUERY_KEY = ['prices', 'v3SpotPrices', { assetIds: ASSET_IDS }];
  const MOCK_STALE_TIME = 30_000;
  const MOCK_QUERY_FN = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetV3SpotPricesQueryOptions.mockReturnValue({
      queryKey: MOCK_QUERY_KEY,
      queryFn: MOCK_QUERY_FN,
      staleTime: MOCK_STALE_TIME,
    });
    mockUseQuery.mockReturnValue({ status: 'loading', data: undefined });
  });

  it('calls getV3SpotPricesQueryOptions with assetIds and currency', () => {
    renderHook(() => useSpotPricesQuery(ASSET_IDS, 'eur'));

    expect(mockGetV3SpotPricesQueryOptions).toHaveBeenCalledWith(ASSET_IDS, {
      currency: 'eur',
    });
  });

  it('uses usd as the default currency', () => {
    renderHook(() => useSpotPricesQuery(ASSET_IDS));

    expect(mockGetV3SpotPricesQueryOptions).toHaveBeenCalledWith(ASSET_IDS, {
      currency: 'usd',
    });
  });

  it('passes queryOptions to useQuery', () => {
    renderHook(() => useSpotPricesQuery(ASSET_IDS));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: MOCK_QUERY_KEY,
        queryFn: MOCK_QUERY_FN,
      }),
    );
  });

  it('sets enabled: true when assetIds is non-empty', () => {
    renderHook(() => useSpotPricesQuery(ASSET_IDS));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
  });

  it('sets enabled: false when assetIds is empty', () => {
    renderHook(() => useSpotPricesQuery([]));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('uses staleTime from queryOptions when no override is given', () => {
    renderHook(() => useSpotPricesQuery(ASSET_IDS));

    const callArg = mockUseQuery.mock.calls[0][0];
    expect(callArg.staleTime).toBe(MOCK_STALE_TIME);
  });

  it('overrides staleTime at call site when staleTimeOverride is provided', () => {
    renderHook(() => useSpotPricesQuery(ASSET_IDS, 'usd', 5_000));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ staleTime: 5_000 }),
    );
  });

  it('does not include staleTime override when staleTimeOverride is undefined', () => {
    // When no override, spread of { staleTime: undefined } is absent — staleTime
    // comes from queryOptions spread, not from a separate override.
    renderHook(() => useSpotPricesQuery(ASSET_IDS));

    const callArg = mockUseQuery.mock.calls[0][0];
    // staleTime is from the queryOptions spread, equals MOCK_STALE_TIME
    expect(callArg.staleTime).toBe(MOCK_STALE_TIME);
    // Confirm the override key is not separately set to undefined
    expect('staleTime' in callArg).toBe(true);
  });
});
