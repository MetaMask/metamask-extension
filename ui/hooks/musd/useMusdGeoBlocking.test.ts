import { renderHook, act } from '@testing-library/react-hooks';
import {
  useMusdGeoBlocking,
  clearGeoLocationCache,
} from './useMusdGeoBlocking';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../components/app/musd/utils', () => ({
  isGeoBlocked: jest.fn(),
}));

jest.mock('../../components/app/musd/constants', () => ({
  GEOLOCATION_API_ENDPOINT: 'https://test-geo.example.com/geolocation',
}));

const { useSelector } = jest.requireMock('react-redux');
const { isGeoBlocked } = jest.requireMock('../../components/app/musd/utils');

const BLOCKED_REGIONS = ['GB', 'US-NY'];

function createFetchResponse(body: string, ok = true, status = 200) {
  return {
    ok,
    status,
    text: jest.fn().mockResolvedValue(body),
  };
}

describe('useMusdGeoBlocking', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    clearGeoLocationCache();

    useSelector.mockReturnValue(BLOCKED_REGIONS);
    isGeoBlocked.mockReturnValue(false);

    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(createFetchResponse('US') as unknown as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('exposes expected return shape', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current).toEqual(
      expect.objectContaining({
        isBlocked: expect.any(Boolean),
        userCountry: expect.any(String),
        isLoading: false,
        error: null,
        blockedRegions: BLOCKED_REGIONS,
        blockedMessage: null,
        refreshGeolocation: expect.any(Function),
      }),
    );
  });

  it('reports isBlocked as false while geolocation is still loading', () => {
    isGeoBlocked.mockReturnValue(true);

    const { result } = renderHook(() => useMusdGeoBlocking());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isBlocked).toBe(false);
  });

  it('fetches geolocation on mount', async () => {
    const { waitForNextUpdate } = renderHook(() => useMusdGeoBlocking());

    await waitForNextUpdate();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test-geo.example.com/geolocation',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sets userCountry from API response', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.userCountry).toBe('US');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('delegates blocking decision to isGeoBlocked', async () => {
    isGeoBlocked.mockReturnValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(isGeoBlocked).toHaveBeenCalledWith('US', BLOCKED_REGIONS);
    expect(result.current.isBlocked).toBe(true);
  });

  it('shows blocked message when user is geo-blocked', async () => {
    isGeoBlocked.mockReturnValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.blockedMessage).toBe(
      'mUSD conversion is not available in your region.',
    );
  });

  it('returns null blockedMessage when user is not blocked', async () => {
    isGeoBlocked.mockReturnValue(false);

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.blockedMessage).toBeNull();
  });

  it('sets error and keeps userCountry null on fetch failure', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('Network error');
    expect(result.current.userCountry).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('fails closed (isBlocked=true) after fetch error with null country', async () => {
    isGeoBlocked.mockReturnValue(true);
    fetchSpy.mockRejectedValue(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.userCountry).toBeNull();
    expect(result.current.isBlocked).toBe(true);
  });

  it('sets error on non-OK response', async () => {
    fetchSpy.mockResolvedValue(
      createFetchResponse('', false, 500) as unknown as Response,
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('Geolocation API error: 500');
    expect(result.current.userCountry).toBeNull();
  });

  it('uses cached geolocation on subsequent renders within cache window', async () => {
    const { waitForNextUpdate } = renderHook(() => useMusdGeoBlocking());
    await waitForNextUpdate();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const { result: result2 } = renderHook(() => useMusdGeoBlocking());

    expect(result2.current.userCountry).toBe('US');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches after cache is cleared', async () => {
    const { waitForNextUpdate } = renderHook(() => useMusdGeoBlocking());
    await waitForNextUpdate();

    clearGeoLocationCache();

    const { waitForNextUpdate: waitForSecond } = renderHook(() =>
      useMusdGeoBlocking(),
    );
    await waitForSecond();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('allows manual refresh via refreshGeolocation', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    clearGeoLocationCache();

    fetchSpy.mockResolvedValue(
      createFetchResponse('DE') as unknown as Response,
    );

    await act(async () => {
      await result.current.refreshGeolocation();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.current.userCountry).toBe('DE');
  });
});
