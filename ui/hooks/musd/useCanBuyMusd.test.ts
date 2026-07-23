import { renderHook } from '@testing-library/react-hooks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { useCanBuyMusd } from './useCanBuyMusd';
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
    refreshGeolocation: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

function mockNetworkResult(
  overrides: Partial<ReturnType<typeof useMusdNetworkFilter>> = {},
) {
  mockNetwork.mockReturnValue({
    isPopularNetworksFilterActive: false,
    selectedChainId: CHAIN_IDS.MAINNET,
    enabledChainIds: [CHAIN_IDS.MAINNET],
    ...overrides,
  });
}

describe('useCanBuyMusd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkResult();
  });

  it('returns canBuyMusdInRegion true when not geo-blocked on a buyable chain', () => {
    mockGeoResult();

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns canBuyMusdInRegion false when geo-blocked', () => {
    mockGeoResult({ isBlocked: true, userCountry: 'GB' });

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns canBuyMusdInRegion false while geo check is in progress', () => {
    mockGeoResult({ isLoading: true });

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('returns canBuyMusdInRegion false on a non-buyable chain', () => {
    mockGeoResult();
    mockNetworkResult({ selectedChainId: CHAIN_IDS.BSC });

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(false);
  });

  it('returns canBuyMusdInRegion true when popular networks filter is active', () => {
    mockGeoResult();
    mockNetworkResult({
      isPopularNetworksFilterActive: true,
      selectedChainId: null,
      enabledChainIds: [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET],
    });

    const { result } = renderHook(() => useCanBuyMusd());

    expect(result.current.canBuyMusdInRegion).toBe(true);
  });
});
