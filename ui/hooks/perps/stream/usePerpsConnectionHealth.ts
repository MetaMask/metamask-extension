import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../../store/background-connection';

const MIN_HIDDEN_DURATION_MS = 30_000;

/**
 * Asks the background to check perps WebSocket health on two triggers:
 *
 * 1. Tab becomes visible after being hidden for >= 30 s.
 * 2. Device transitions from offline to online.
 *
 * The actual reconnection logic and REST hydration live in
 * PerpsStreamBridge (background), which subscribes to the controller's
 * connection-state events directly.  This hook is intentionally thin —
 * it only nudges the background when the UI regains focus.
 *
 * Mount this in PerpsLayout so all perps views benefit.
 */
export function usePerpsConnectionHealth(): void {
  const isDeviceOffline = useSelector(
    (state: { metamask?: { connectivityStatus?: string } }) =>
      state.metamask?.connectivityStatus === 'offline',
  );

  const hiddenAtRef = useRef<number | null>(null);
  const prevOfflineRef = useRef(isDeviceOffline);

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

        submitRequestToBackground('perpsCheckHealth').catch(() => {
          // fire-and-forget
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = isDeviceOffline;

    if (wasOffline && !isDeviceOffline) {
      submitRequestToBackground('perpsCheckHealth').catch(() => {
        // fire-and-forget
      });
    }
  }, [isDeviceOffline]);
}
