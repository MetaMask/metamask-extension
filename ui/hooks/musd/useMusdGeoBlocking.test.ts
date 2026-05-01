import { renderHook, act } from '@testing-library/react-hooks';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../components/app/musd/utils', () => ({
  isGeoBlocked: jest.fn(),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');
const { isGeoBlocked } = jest.requireMock('../../components/app/musd/utils');
const { submitRequestToBackground } = jest.requireMock(
  '../../store/background-connection',
);

const BLOCKED_REGIONS = ['GB', 'US-NY'];

describe('useMusdGeoBlocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useSelector.mockReturnValue(BLOCKED_REGIONS);
    isGeoBlocked.mockReturnValue(false);

    submitRequestToBackground.mockResolvedValue('US');
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

  it('calls the GeolocationController on mount', async () => {
    const { waitForNextUpdate } = renderHook(() => useMusdGeoBlocking());

    await waitForNextUpdate();

    expect(submitRequestToBackground).toHaveBeenCalledWith('getGeolocation');
  });

  it('sets userCountry from the controller response', async () => {
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

  it('treats an UNKNOWN response as an unknown country (userCountry=null)', async () => {
    submitRequestToBackground.mockResolvedValue('UNKNOWN');
    isGeoBlocked.mockReturnValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.userCountry).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isBlocked).toBe(true);
  });

  it('sets error and keeps userCountry null when the background call throws', async () => {
    submitRequestToBackground.mockRejectedValue(new Error('Background error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('Background error');
    expect(result.current.userCountry).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('fails closed (isBlocked=true) after a background failure', async () => {
    isGeoBlocked.mockReturnValue(true);
    submitRequestToBackground.mockRejectedValue(new Error('Background error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.userCountry).toBeNull();
    expect(result.current.isBlocked).toBe(true);
  });

  it('allows manual refresh via refreshGeolocation', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useMusdGeoBlocking(),
    );

    await waitForNextUpdate();
    expect(submitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(submitRequestToBackground).toHaveBeenLastCalledWith(
      'getGeolocation',
    );

    submitRequestToBackground.mockResolvedValue('DE');

    await act(async () => {
      await result.current.refreshGeolocation();
    });

    expect(submitRequestToBackground).toHaveBeenCalledTimes(2);
    expect(submitRequestToBackground).toHaveBeenLastCalledWith(
      'refreshGeolocation',
    );
    expect(result.current.userCountry).toBe('DE');
  });
});
