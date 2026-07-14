import { renderHook, act } from '@testing-library/react-hooks';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from '../../../shared/constants/app';
import {
  useRedirectAfterDefaultPage,
  usePendingRedirectRoute,
  useLastVisitedPerpsRoute,
} from './useHomeRedirects';

// ---------------------------------------------------------------------------
// useRedirectAfterDefaultPage
// ---------------------------------------------------------------------------

describe('useRedirectAfterDefaultPage', () => {
  it('does nothing when redirectAfterDefaultPage is undefined', () => {
    const navigate = jest.fn();
    const clearRedirectAfterDefaultPage = jest.fn();

    renderHook(() =>
      useRedirectAfterDefaultPage({ navigate, clearRedirectAfterDefaultPage }),
    );

    expect(navigate).not.toHaveBeenCalled();
    expect(clearRedirectAfterDefaultPage).not.toHaveBeenCalled();
  });

  it('does nothing when shouldRedirect is false', () => {
    const navigate = jest.fn();
    const clearRedirectAfterDefaultPage = jest.fn();

    renderHook(() =>
      useRedirectAfterDefaultPage({
        redirectAfterDefaultPage: { shouldRedirect: false, path: '/foo' },
        navigate,
        clearRedirectAfterDefaultPage,
      }),
    );

    expect(navigate).not.toHaveBeenCalled();
    expect(clearRedirectAfterDefaultPage).not.toHaveBeenCalled();
  });

  it('navigates and clears when shouldRedirect is true', () => {
    const navigate = jest.fn();
    const clearRedirectAfterDefaultPage = jest.fn();

    renderHook(() =>
      useRedirectAfterDefaultPage({
        redirectAfterDefaultPage: { shouldRedirect: true, path: '/foo' },
        navigate,
        clearRedirectAfterDefaultPage,
      }),
    );

    expect(navigate).toHaveBeenCalledWith('/foo');
    expect(clearRedirectAfterDefaultPage).toHaveBeenCalled();
  });

  it('navigates again when redirectAfterDefaultPage updates to a new value', () => {
    const navigate = jest.fn();
    const clearRedirectAfterDefaultPage = jest.fn();

    const { rerender } = renderHook(
      ({ path }: { path: string }) =>
        useRedirectAfterDefaultPage({
          redirectAfterDefaultPage: { shouldRedirect: true, path },
          navigate,
          clearRedirectAfterDefaultPage,
        }),
      { initialProps: { path: '/foo' } },
    );

    expect(navigate).toHaveBeenCalledTimes(1);

    act(() => {
      rerender({ path: '/bar' });
    });

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith('/bar');
  });
});

// ---------------------------------------------------------------------------
// usePendingRedirectRoute
// ---------------------------------------------------------------------------

describe('usePendingRedirectRoute', () => {
  it('does nothing when pendingRedirectRoute is null', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    renderHook(() =>
      usePendingRedirectRoute({
        pendingRedirectRoute: null,
        setRedirectAfterDefaultPage,
        clearPendingRedirectRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearPendingRedirectRoute).not.toHaveBeenCalled();
  });

  it('redirects and clears when route has no environmentType restriction', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    renderHook(() =>
      usePendingRedirectRoute({
        pendingRedirectRoute: { path: '/shield-plan' },
        setRedirectAfterDefaultPage,
        clearPendingRedirectRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('appends search when route includes a search query', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    renderHook(() =>
      usePendingRedirectRoute({
        pendingRedirectRoute: {
          path: '/shield-plan',
          search: '?source=checkout',
        },
        setRedirectAfterDefaultPage,
        clearPendingRedirectRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan?source=checkout',
    });
    expect(clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('redirects when environmentType matches the current env', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    renderHook(() =>
      usePendingRedirectRoute({
        envType: ENVIRONMENT_TYPE_POPUP,
        pendingRedirectRoute: {
          path: '/shield-plan',
          environmentType: ENVIRONMENT_TYPE_POPUP,
        },
        setRedirectAfterDefaultPage,
        clearPendingRedirectRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('does not redirect but still clears when environmentType does not match', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    renderHook(() =>
      usePendingRedirectRoute({
        envType: ENVIRONMENT_TYPE_FULLSCREEN,
        pendingRedirectRoute: {
          path: '/shield-plan',
          environmentType: ENVIRONMENT_TYPE_POPUP,
        },
        setRedirectAfterDefaultPage,
        clearPendingRedirectRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('fires when pendingRedirectRoute transitions from null to a value', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    const { rerender } = renderHook(
      ({ route }: { route: { path: string } | null }) =>
        usePendingRedirectRoute({
          pendingRedirectRoute: route,
          setRedirectAfterDefaultPage,
          clearPendingRedirectRoute,
        }),
      { initialProps: { route: null as { path: string } | null } },
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearPendingRedirectRoute).not.toHaveBeenCalled();

    act(() => {
      rerender({ route: { path: '/shield-plan' } });
    });

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(clearPendingRedirectRoute).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useLastVisitedPerpsRoute
// ---------------------------------------------------------------------------

describe('useLastVisitedPerpsRoute', () => {
  const FRESH_ENOUGH_OFFSET_MS = 60_000;
  const TTL_MS = 5 * 60_000;

  it('does nothing when lastVisitedPerpsRoute is null', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        lastVisitedPerpsRoute: null,
        setRedirectAfterDefaultPage,
        clearLastVisitedPerpsRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearLastVisitedPerpsRoute).not.toHaveBeenCalled();
  });

  it('redirects to the persisted perps path when within the TTL', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        lastVisitedPerpsRoute: {
          path: '/perps/market/BTC',
          timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
        },
        setRedirectAfterDefaultPage,
        clearLastVisitedPerpsRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/perps/market/BTC',
    });
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('does not redirect but still clears when TTL has expired', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        lastVisitedPerpsRoute: {
          path: '/perps/market/BTC',
          timestamp: Date.now() - (TTL_MS + 1_000),
        },
        setRedirectAfterDefaultPage,
        clearLastVisitedPerpsRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('ignores persisted path that does not start with /perps', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        lastVisitedPerpsRoute: {
          path: '/settings',
          timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
        },
        setRedirectAfterDefaultPage,
        clearLastVisitedPerpsRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('rejects a path with the /perps prefix that is not actually a /perps subroute', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        lastVisitedPerpsRoute: {
          path: '/perpsNew/market/BTC',
          timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
        },
        setRedirectAfterDefaultPage,
        clearLastVisitedPerpsRoute,
      }),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('defers to pendingRedirectRoute when both are set but still clears the persisted perps entry', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        pendingRedirectRoute: { path: '/shield-plan' },
        lastVisitedPerpsRoute: {
          path: '/perps/market/BTC',
          timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
        },
        setRedirectAfterDefaultPage,
        clearLastVisitedPerpsRoute,
      }),
    );

    // The pending redirect wins — perps resume must not fire.
    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    // Even when pendingRedirectRoute wins, the perps entry must be cleared
    // so a later home mount cannot replay it after the higher-priority
    // redirect has already fired.
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('skips the redirect but still clears when PerpsLayout just unmounted in-app', async () => {
    const markerModulePath = '../../helpers/perps/in-app-leave-marker';
    const {
      markPerpsUnmountInApp,
      __resetPerpsInAppLeaveMarkerForTests: resetPerpsInAppLeaveMarkerForTests,
    } = await import(markerModulePath);

    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    try {
      markPerpsUnmountInApp();

      renderHook(() =>
        useLastVisitedPerpsRoute({
          lastVisitedPerpsRoute: {
            path: '/perps/market/BTC',
            timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
          },
          setRedirectAfterDefaultPage,
          clearLastVisitedPerpsRoute,
        }),
      );

      expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
      expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
    } finally {
      resetPerpsInAppLeaveMarkerForTests();
    }
  });

  it('fires when lastVisitedPerpsRoute transitions from null to a value', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    const { rerender } = renderHook(
      ({ route }: { route: { path: string; timestamp: number } | null }) =>
        useLastVisitedPerpsRoute({
          lastVisitedPerpsRoute: route,
          setRedirectAfterDefaultPage,
          clearLastVisitedPerpsRoute,
        }),
      {
        initialProps: {
          route: null as { path: string; timestamp: number } | null,
        },
      },
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearLastVisitedPerpsRoute).not.toHaveBeenCalled();

    act(() => {
      rerender({
        route: {
          path: '/perps/market/BTC',
          timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
        },
      });
    });

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/perps/market/BTC',
    });
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });
});
