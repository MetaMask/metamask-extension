import { renderHook } from '@testing-library/react-hooks';
import { useCanBuyMusd, clearRegionTokenCache } from './useCanBuyMusd';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';

jest.mock('./useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: jest.fn(),
}));

jest.mock('./useMusdNetworkFilter', () => ({
  useMusdNetworkFilter: jest.fn(),
}));

const mockGeo = jest.mocked(useMusdGeoBlocking);
const mockNetwork = jest.mocked(useMusdNetworkFilter);
const mockFetch = jest.fn();

function mockGeoResult(
  overrides: Partial<ReturnType<typeof useMusdGeoBlocking>> = {},
) {
  mockGeo.mockReturnValue({
    isBlocked: false,
    isLoading: false,
    userCountry: 'US',
    error: null,
    blockedRegions: ['GB'],
    blockedMessage: null,
    refreshGeolocation: jest.fn(),
    ...overrides,
  });
}

function mockNetworkResult(
  overrides: Partial<ReturnType<typeof useMusdNetworkFilter>> = {},
) {
  mockNetwork.mockReturnValue({
    isPopularNetworksFilterActive: false,
    selectedChainId: '0x1',
    enabledChainIds: ['0x1'],
    ...overrides,
  });
}

function mockTokenApiSuccess(hasTokens = true) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      topTokens: hasTokens ? [{ symbol: 'USDC' }] : [],
      allTokens: hasTokens ? [{ symbol: 'USDC' }] : [],
    }),
  });
}

function mockTokenApiError() {
  mockFetch.mockRejectedValue(new Error('Network error'));
}

describe('useCanBuyMusd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRegionTokenCache();
    jest.spyOn(global, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when not geo-blocked, buyable chain enabled, and ramp tokens available', async () => {
    mockGeoResult();
    mockNetworkResult();
    mockTokenApiSuccess();

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns false when geo-blocked', async () => {
    mockGeoResult({ isBlocked: true, userCountry: 'GB' });
    mockNetworkResult();
    mockTokenApiSuccess();

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns false when not geo-blocked but no buyable chain enabled', async () => {
    mockGeoResult();
    mockNetworkResult({ selectedChainId: '0x38', enabledChainIds: ['0x38'] });
    mockTokenApiSuccess();

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns false when token cache API returns empty tokens', async () => {
    mockGeoResult();
    mockNetworkResult();
    mockTokenApiSuccess(false);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns false when token cache API errors (fail closed)', async () => {
    mockGeoResult();
    mockNetworkResult();
    mockTokenApiError();

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns false when userCountry is null (no geolocation)', () => {
    mockGeoResult({ userCountry: null });
    mockNetworkResult();

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('reports isLoading true while geo check is in progress', () => {
    mockGeoResult({ isLoading: true, userCountry: null });
    mockNetworkResult();

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.isLoading).toBe(true);
  });

  it('reports isLoading true while ramp region check is in progress', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    mockGeoResult();
    mockNetworkResult();

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.isLoading).toBe(true);
  });

  it('calls token cache API with lowercased country code', async () => {
    mockGeoResult({ userCountry: 'US' });
    mockNetworkResult();
    mockTokenApiSuccess();

    const { waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/regions/us/tokens'),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('action=buy'),
    );
  });

  it('returns false when token cache API returns non-ok response', async () => {
    mockGeoResult();
    mockNetworkResult();
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());

    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });
});
