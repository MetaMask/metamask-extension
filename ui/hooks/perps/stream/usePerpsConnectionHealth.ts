import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { Position, Order, AccountState } from '@metamask/perps-controller';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { submitRequestToBackground } from '../../../store/background-connection';

const STALE_THRESHOLD_MS = 60_000;
const MIN_HEALTH_CHECK_INTERVAL_MS = 15_000;
const MIN_HIDDEN_DURATION_MS = 30_000;

/**
 * Monitors perps WebSocket health and triggers reconnection when needed.
 *
 * Detects two failure modes:
 * 1. Zombie sockets: WS appears connected but no data flows (laptop sleep, wifi drop).
 * Detected via data staleness — if no background stream update has arrived in
 * STALE_THRESHOLD_MS, the connection is presumed dead.
 * 2. Exhausted retries: the SDK gave up reconnecting while the UI was hidden.
 * Detected by querying the controller's WebSocket connection state.
 *
 * On reconnection, REST data is fetched immediately to hydrate channels while
 * the WS transport is being re-established.
 *
 * Mount this in PerpsLayout so all perps views benefit.
 */
export function usePerpsConnectionHealth(): void {
  const streamManager = getPerpsStreamManager();
  const isDeviceOffline = useSelector(
    (state: { metamask?: { connectivityStatus?: string } }) =>
      state.metamask?.connectivityStatus === 'offline',
  );

  const lastCheckRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);
  const prevOfflineRef = useRef(isDeviceOffline);
  const isCheckingRef = useRef(false);

  const checkAndReconnect = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }
    if (Date.now() - lastCheckRef.current < MIN_HEALTH_CHECK_INTERVAL_MS) {
      return;
    }
    if (!streamManager.isInitialized()) {
      return;
    }

    isCheckingRef.current = true;
    lastCheckRef.current = Date.now();

    try {
      const lastUpdate = streamManager.getLastStreamUpdateAt();
      const staleness = lastUpdate === 0 ? Infinity : Date.now() - lastUpdate;

      let connectionState: string;
      try {
        connectionState = await submitRequestToBackground<string>(
          'perpsGetConnectionState',
        );
      } catch {
        connectionState = 'unknown';
      }

      const needsReconnect =
        staleness > STALE_THRESHOLD_MS || connectionState === 'disconnected';

      if (!needsReconnect) {
        return;
      }

      try {
        await submitRequestToBackground('perpsReconnect');
      } catch (err) {
        console.warn('[Perps] Connection health reconnect failed:', err);
      }

      const [positionsResult, ordersResult, accountResult] =
        await Promise.allSettled([
          submitRequestToBackground<Position[]>('perpsGetPositions', [
            { skipCache: true },
          ]),
          submitRequestToBackground<Order[]>('perpsGetOpenOrders'),
          submitRequestToBackground<AccountState>('perpsGetAccountState'),
        ]);

      if (positionsResult.status === 'fulfilled' && positionsResult.value) {
        streamManager.pushPositionsWithOverrides(positionsResult.value);
      }
      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        streamManager.orders.pushData(ordersResult.value);
      }
      if (accountResult.status === 'fulfilled') {
        streamManager.account.pushData(accountResult.value ?? null);
      }
    } catch (err) {
      console.warn('[Perps] Connection health check failed:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [streamManager]);

  // Track when the document becomes hidden so we can skip checks for short hides
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const hiddenAt = hiddenAtRef.current;
        hiddenAtRef.current = null;

        if (
          hiddenAt !== null &&
          Date.now() - hiddenAt < MIN_HIDDEN_DURATION_MS
        ) {
          return;
        }

        checkAndReconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndReconnect]);

  // Trigger reconnect when device comes back online
  useEffect(() => {
    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = isDeviceOffline;

    if (wasOffline && !isDeviceOffline) {
      checkAndReconnect();
    }
  }, [isDeviceOffline, checkAndReconnect]);
}
