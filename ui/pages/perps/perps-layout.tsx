import React, { useEffect, useLayoutEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { PROVIDER_CONFIG } from '@metamask/perps-controller';
import { PerpsToastProvider } from '../../components/app/perps';
import { usePerpsViewActive } from '../../hooks/perps/stream/usePerpsViewActive';
import { usePerpsLifecycleBreadcrumbs } from '../../hooks/perps/usePerpsLifecycleBreadcrumbs';
import { submitRequestToBackground } from '../../store/background-connection';
import { setLastVisitedPerpsRoute } from '../../store/actions';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';
import {
  getSelectedInternalAccount,
  type AccountsState,
} from '../../selectors/accounts';
import { markPerpsUnmountInApp } from '../../helpers/perps/in-app-leave-marker';

const MIN_HIDDEN_DURATION_MS = 30_000;

/**
 * Layout wrapper for all Perps pages.
 *
 * This component is lazy-loaded via mmLazy in routes so that
 * the Perps dependency chain (PerpsStreamManager, etc.) is excluded from
 * the common bundle and only loaded when a user first navigates to a Perps route.
 *
 * It is the single point that gates background stream emission: mounting
 * signals the background to start forwarding WebSocket data to this connection,
 * and unmounting signals it to stop.
 */
type PerpsControllerCacheSnapshot = {
  activeProvider?: string;
  isTestnet?: boolean;
  cachedMarketDataByProvider?: Record<
    string,
    { data: unknown[]; timestamp: number } | undefined
  >;
  cachedUserDataByProvider?: Record<
    string,
    | {
        positions?: unknown[];
        orders?: unknown[];
        accountState?: unknown;
        timestamp: number;
        address?: string;
      }
    | undefined
  >;
};

type ReduxStateWithPerpsCache = { metamask: PerpsControllerCacheSnapshot };

export default function PerpsLayout() {
  usePerpsViewActive('PerpsLayout');
  usePerpsLifecycleBreadcrumbs();

  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { pathname, search } = useLocation();

  const selectedAddress = useSelector(
    (state: AccountsState) =>
      getSelectedInternalAccount(state)?.address ?? null,
  );

  // Seed `PerpsStreamManager` synchronously from the background controller's
  // persisted caches so a cold popup mount renders real data on the first
  // frame instead of flashing a skeleton while WS/REST hydration catches up.
  // Matches the route persistence + WS grace window already shipped for the
  // close/reopen scenario — this closes the last remaining "no loading" gap.
  //
  // `shallowEqual` prevents the selector from invalidating on every
  // unrelated redux mutation. The underlying controller-cache fields are
  // immutable per write so field-level reference stability is enough.
  const cacheSnapshot = useSelector((state: ReduxStateWithPerpsCache) => {
    const m = state.metamask;
    const provider = m.activeProvider ?? PROVIDER_CONFIG.DefaultProvider;
    const cacheKey = `${provider}:${m.isTestnet ? 'testnet' : 'mainnet'}`;
    const marketEntry = m.cachedMarketDataByProvider?.[cacheKey];
    const userEntry = m.cachedUserDataByProvider?.[cacheKey];
    return {
      markets: marketEntry?.data,
      positions: userEntry?.positions,
      orders: userEntry?.orders,
      account: userEntry?.accountState,
      address: userEntry?.address,
    };
  }, shallowEqual);
  useLayoutEffect(() => {
    getPerpsStreamManager().hydrateFromControllerCache(
      cacheSnapshot as Parameters<
        ReturnType<typeof getPerpsStreamManager>['hydrateFromControllerCache']
      >[0],
      selectedAddress,
    );
  }, [cacheSnapshot, selectedAddress]);

  // Persist the active Perps path on every in-Perps navigation so that a
  // brief close/reopen within PERPS_REOPEN_TTL_MS returns the user to this
  // exact screen. We do NOT clear on pathname change — only on true React
  // unmount via the effect below — to avoid a null-vs-next-path race when
  // the user navigates rapidly between Perps screens.
  useEffect(() => {
    const fullPath = search ? `${pathname}${search}` : pathname;
    Promise.resolve(dispatch(setLastVisitedPerpsRoute(fullPath))).catch(() => {
      // fire-and-forget — persistence failure should not break Perps
    });
  }, [dispatch, pathname, search]);

  // Clear only when the user intentionally leaves Perps in-app. A popup
  // close kills the page before React processes this cleanup, so the
  // persisted value survives and the next home mount picks it up.
  // `useLayoutEffect` so the cleanup runs in the layout phase — before
  // the about-to-mount Home's `componentDidMount` reads the marker.
  // A `useEffect` cleanup fires in the passive phase, which React
  // schedules after `componentDidMount` of newly mounted siblings.
  useLayoutEffect(() => {
    return () => {
      markPerpsUnmountInApp();
      Promise.resolve(dispatch(setLastVisitedPerpsRoute(null))).catch(() => {
        // fire-and-forget
      });
    };
  }, [dispatch]);

  // Nudge background perps WebSocket health when the tab becomes visible after
  // being hidden for a while. Offline→online is handled in PerpsStreamBridge.
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }

      const wasHiddenAt = hiddenAt;
      hiddenAt = null;

      if (
        wasHiddenAt !== null &&
        Date.now() - wasHiddenAt < MIN_HIDDEN_DURATION_MS
      ) {
        return;
      }

      submitRequestToBackground('perpsCheckHealth').catch(() => {
        // fire-and-forget
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <PerpsToastProvider>
      <Outlet />
    </PerpsToastProvider>
  );
}
