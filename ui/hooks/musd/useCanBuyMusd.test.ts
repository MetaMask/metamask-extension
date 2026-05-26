import { renderHook } from '@testing-library/react-hooks';
import {
  useCanBuyMusd,
  clearRegionTokenCache,
  fetchRegionTokens,
  type RampToken,
} from './useCanBuyMusd';
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

const MAINNET_MUSD_ASSET_ID =
  'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const LINEA_MUSD_ASSET_ID =
  'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

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

function makeMusdToken(assetId: string, tokenSupported = true): RampToken {
  return { assetId, tokenSupported };
}

function mockTokenApi(allTokens: RampToken[]) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ allTokens }),
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
    mockNetworkResult();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------
  // canBuyMusdInRegion (aggregate gate)
  // -------------------------------------------------------------------

  it('returns canBuyMusdInRegion true when not geo-blocked and mUSD is buyable on selected chain', async () => {
    mockGeoResult();
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns canBuyMusdInRegion false when geo-blocked', async () => {
    mockGeoResult({ isBlocked: true, userCountry: 'GB' });
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns canBuyMusdInRegion false when mUSD is not in the token list', async () => {
    mockGeoResult();
    mockTokenApi([{ assetId: 'eip155:1/erc20:0xOTHER', tokenSupported: true }]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns canBuyMusdInRegion false when token list is empty', async () => {
    mockGeoResult();
    mockTokenApi([]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns canBuyMusdInRegion false when API errors (fail closed)', async () => {
    mockGeoResult();
    mockTokenApiError();

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns canBuyMusdInRegion false when userCountry is null', () => {
    mockGeoResult({ userCountry: null });

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // isMusdBuyableOnChain (per-chain map)
  // -------------------------------------------------------------------

  it('marks Mainnet buyable and Linea not buyable when only Mainnet token is present', async () => {
    mockGeoResult();
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyableOnChain['0x1']).toBe(true);
    expect(result.current.isMusdBuyableOnChain['0xe708']).toBe(false);
  });

  it('marks both chains buyable when both tokens are present', async () => {
    mockGeoResult();
    mockTokenApi([
      makeMusdToken(MAINNET_MUSD_ASSET_ID),
      makeMusdToken(LINEA_MUSD_ASSET_ID),
    ]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyableOnChain['0x1']).toBe(true);
    expect(result.current.isMusdBuyableOnChain['0xe708']).toBe(true);
  });

  it('returns false for a chain when tokenSupported is false', async () => {
    mockGeoResult();
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID, false)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyableOnChain['0x1']).toBe(false);
    expect(result.current.isMusdBuyableOnAnyChain).toBe(false);
    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('matches asset IDs case-insensitively', async () => {
    mockGeoResult();
    mockTokenApi([
      { assetId: MAINNET_MUSD_ASSET_ID.toLowerCase(), tokenSupported: true },
    ]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyableOnChain['0x1']).toBe(true);
  });

  // -------------------------------------------------------------------
  // isMusdBuyableOnAnyChain
  // -------------------------------------------------------------------

  it('sets isMusdBuyableOnAnyChain true when at least one chain has mUSD', async () => {
    mockGeoResult();
    mockTokenApi([makeMusdToken(LINEA_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyableOnAnyChain).toBe(true);
  });

  it('sets isMusdBuyableOnAnyChain false when no chain has mUSD', async () => {
    mockGeoResult();
    mockTokenApi([]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyableOnAnyChain).toBe(false);
  });

  // -------------------------------------------------------------------
  // isMusdBuyable (network-filter-aware)
  // -------------------------------------------------------------------

  it('isMusdBuyable uses isMusdBuyableOnAnyChain when popular networks filter is active', async () => {
    mockGeoResult();
    mockNetworkResult({
      isPopularNetworksFilterActive: true,
      selectedChainId: null,
      enabledChainIds: ['0x1', '0xe708'],
    });
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyable).toBe(true);
    expect(result.current.canBuyMusdInRegion).toBe(true);
  });

  it('isMusdBuyable checks specific chain when single chain selected', async () => {
    mockGeoResult();
    mockNetworkResult({ selectedChainId: '0xe708' });
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyable).toBe(false);
    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('isMusdBuyable is true when selected chain has mUSD', async () => {
    mockGeoResult();
    mockNetworkResult({ selectedChainId: '0x1' });
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyable).toBe(true);
  });

  it('isMusdBuyable is false for an unknown chain', async () => {
    mockGeoResult();
    mockNetworkResult({ selectedChainId: '0x38' });
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyable).toBe(false);
  });

  it('isMusdBuyable is false when no chain selected and not popular networks', async () => {
    mockGeoResult();
    mockNetworkResult({
      isPopularNetworksFilterActive: false,
      selectedChainId: null,
    });
    mockTokenApi([makeMusdToken(MAINNET_MUSD_ASSET_ID)]);

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.isMusdBuyable).toBe(false);
  });

  // -------------------------------------------------------------------
  // Loading states
  // -------------------------------------------------------------------

  it('reports isLoading true while geo check is in progress', () => {
    mockGeoResult({ isLoading: true, userCountry: null });

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.isLoading).toBe(true);
  });

  it('reports isLoading true while ramp token fetch is in progress', () => {
    mockFetch.mockReturnValue(
      new Promise(() => {
        // no op
      }),
    );
    mockGeoResult();

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.isLoading).toBe(true);
  });

  // -------------------------------------------------------------------
  // API call shape
  // -------------------------------------------------------------------

  it('calls token cache API with lowercased country and action=buy', async () => {
    mockGeoResult({ userCountry: 'US' });
    mockTokenApi([]);

    const { waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/regions/us/tokens'),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('action=buy'),
    );
  });

  it('returns empty per-chain map when API returns non-ok response', async () => {
    mockGeoResult();
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result, waitForNextUpdate } = renderHook(() => useCanBuyMusd());
    await waitForNextUpdate();

    expect(result.current.canBuyMusdInRegion).toBe(false);
    expect(result.current.isMusdBuyableOnChain['0x1']).toBe(false);
    expect(result.current.isMusdBuyableOnChain['0xe708']).toBe(false);
  });

  // -------------------------------------------------------------------
  // Error caching
  // -------------------------------------------------------------------

  it('does not cache error responses so subsequent calls retry the API', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const first = await fetchRegionTokens('US');
    expect(first).toStrictEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        allTokens: [makeMusdToken(MAINNET_MUSD_ASSET_ID)],
      }),
    });

    const second = await fetchRegionTokens('US');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(second).toHaveLength(1);
    expect(second[0].assetId).toBe(MAINNET_MUSD_ASSET_ID);
  });

  it('does not cache non-ok HTTP responses so subsequent calls retry the API', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const first = await fetchRegionTokens('US');
    expect(first).toStrictEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        allTokens: [makeMusdToken(MAINNET_MUSD_ASSET_ID)],
      }),
    });

    const second = await fetchRegionTokens('US');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(second).toHaveLength(1);
  });
});
