import { it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import * as braze from '@braze/web-sdk';
import {
  getIdentifiedBrazeProfileId,
  identifyBrazeUser,
} from './identify-braze-user';
import { useBrazeBanner } from './use-braze-banner';

jest.mock('./identify-braze-user', () => ({
  identifyBrazeUser: jest.fn(),
  getIdentifiedBrazeProfileId: jest.fn(),
}));

describe('useBrazeBanner', () => {
  let subscriber: (event: braze.BannersEvent) => void;
  let cached: braze.Banner | undefined;
  const makeBanner = (id = 'campaign-1', body: string | null = 'Hello') =>
    ({
      id,
      placementId: 'home',
      isControl: false,
      getStringProperty: (key: string) => (key === 'body' ? body : null),
      getImageProperty: () => null,
    }) as unknown as braze.Banner;

  const update = (banner?: braze.Banner) =>
    act(() =>
      subscriber({
        type: 'DATA_UPDATED',
        reason: 'MANUAL_SERVER_REFRESH',
        cacheSnapshot: {
          banners: banner ? { home: banner } : {},
          lastSyncAt: 1,
        },
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    cached = undefined;
    jest.mocked(identifyBrazeUser).mockReturnValue(true);
    jest.mocked(getIdentifiedBrazeProfileId).mockReturnValue('profile-1');
    jest
      .mocked(braze.subscribeToBannersEvents)
      .mockImplementation((callback) => {
        subscriber = callback;
        callback({
          type: 'CACHE_REPLAY',
          cacheSnapshot: { banners: { home: cached }, lastSyncAt: 0 },
        });
        return 'subscription';
      });
  });

  afterEach(() => jest.useRealTimers());

  it('identifies before reading warm cache and refreshing only this placement', () => {
    cached = makeBanner();
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    expect(result.current.status).toBe('visible');
    expect(result.current.banner).toBe(cached);
    expect(
      jest.mocked(identifyBrazeUser).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(braze.subscribeToBannersEvents).mock.invocationCallOrder[0],
    );
    expect(braze.requestBannersRefresh).toHaveBeenCalledWith(['home']);
  });

  it('never reads cache if identification fails', () => {
    jest.mocked(identifyBrazeUser).mockReturnValue(false);
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    expect(result.current.status).toBe('empty');
    expect(braze.subscribeToBannersEvents).not.toHaveBeenCalled();
  });

  it('ignores a late first campaign after the startup window', () => {
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() => jest.advanceTimersByTime(5000));
    update(makeBanner());
    expect(result.current.status).toBe('empty');
  });

  it('deduplicates IDs and accepts replacement in an already-visible slot', () => {
    cached = makeBanner();
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    update(makeBanner());
    expect(result.current.banner).toBe(cached);
    act(() => jest.advanceTimersByTime(5000));
    const replacement = makeBanner('campaign-2');
    update(replacement);
    expect(result.current.banner).toBe(replacement);
  });

  it.each(['control', 'blank', 'missing'])('hides %s campaigns', (kind) => {
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    update(
      kind === 'missing'
        ? undefined
        : ({
            ...makeBanner('id', kind === 'blank' ? ' ' : 'Hello'),
            isControl: kind === 'control',
          } as unknown as braze.Banner),
    );
    expect(result.current.status).toBe('empty');
  });

  it('removes an existing banner when the SDK removes its placement', () => {
    cached = makeBanner();
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    update();
    expect(result.current.banner).toBeNull();
  });

  it('hides immediately and invokes SDK dismissal once despite subsequent updates', () => {
    cached = makeBanner();
    jest.mocked(braze.dismissBanner).mockImplementationOnce(() => {
      subscriber({
        type: 'DATA_UPDATED',
        reason: 'CLIENT_ACTION',
        cacheSnapshot: { banners: {}, lastSyncAt: 1 },
      });
      return true;
    });
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() => {
      result.current.dismiss();
      result.current.dismiss();
    });
    update(makeBanner('campaign-2'));
    expect(result.current.status).toBe('dismissed');
    expect(braze.dismissBanner).toHaveBeenCalledTimes(1);
    expect(braze.dismissBanner).toHaveBeenCalledWith(cached);
  });

  it('ignores impression events on the unified stream', () => {
    cached = makeBanner();
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() =>
      subscriber({
        type: 'IMPRESSION',
        banner: cached as braze.Banner,
        action: 'ENQUEUED',
      }),
    );
    expect(result.current.banner).toBe(cached);
  });

  it('clears displayed content on cache load', () => {
    cached = makeBanner();
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() =>
      subscriber({
        type: 'CACHE_LOAD',
        cacheSnapshot: { banners: {}, lastSyncAt: 0 },
      }),
    );
    expect(result.current.banner).toBeNull();
  });

  it('ignores updates for a stale profile identity', () => {
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    jest.mocked(getIdentifiedBrazeProfileId).mockReturnValue('profile-2');
    update(makeBanner());
    expect(result.current.status).toBe('loading');
  });

  it('cleans up subscription and startup timer', () => {
    const { unmount } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    unmount();
    expect(braze.removeSubscription).toHaveBeenCalledWith('subscription');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('allows initial feature-disabled configuration to become enabled', () => {
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() =>
      subscriber({
        type: 'ERROR',
        reason: 'FEATURE_DISABLED',
        retryState: 'DO_NOT_RETRY',
      }),
    );
    update(makeBanner());
    expect(result.current.status).toBe('visible');
  });

  it('does not retry a terminal client error', () => {
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() =>
      subscriber({
        type: 'ERROR',
        reason: 'CLIENT_ERROR',
        retryState: 'DO_NOT_RETRY',
      }),
    );
    expect(result.current.status).toBe('empty');
    expect(braze.requestBannersRefresh).toHaveBeenCalledTimes(1);
  });

  it('waits for SDK-managed retries without issuing another refresh', () => {
    const { result } = renderHook(() => useBrazeBanner('home', 'profile-1'));
    act(() =>
      subscriber({
        type: 'ERROR',
        reason: 'SERVER_ERROR',
        retryState: 'SDK_WILL_RETRY',
      }),
    );
    update(makeBanner());
    expect(result.current.status).toBe('visible');
    expect(braze.requestBannersRefresh).toHaveBeenCalledTimes(1);
  });
});
