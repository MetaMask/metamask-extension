import { useEffect } from 'react';
import { submitRequestToBackground } from '../../../store/background-connection';

const MIN_HIDDEN_DURATION_MS = 30_000;

/**
 * Asks the background to check perps WebSocket health when the tab
 * becomes visible after being hidden for >= 30 s.
 *
 * The offline→online transition is handled in PerpsStreamBridge
 * (background) via ConnectivityController state changes. The actual
 * reconnection logic and REST hydration also live there.
 *
 * This hook is intentionally thin — it only nudges the background
 * when the UI regains focus after a long absence.
 *
 * Mount this in PerpsLayout so all perps views benefit.
 */
export function usePerpsReconnectOnFocus(): void {
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
}
