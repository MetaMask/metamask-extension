import { renderHook } from '@testing-library/react-hooks';
import { useCanBuyMusd } from './useCanBuyMusd';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';

jest.mock('./useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: jest.fn(),
}));

const mockGeo = jest.mocked(useMusdGeoBlocking);

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

describe('useCanBuyMusd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns canBuyMusdInRegion true when not geo-blocked', () => {
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
});
