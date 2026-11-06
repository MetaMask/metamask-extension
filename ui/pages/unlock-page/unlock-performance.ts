import type { createHashRouter } from 'react-router-dom';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { DEFAULT_ROUTE, UNLOCK_ROUTE } from '../../helpers/constants/routes';
import {
  registerDocumentLoadMeasurement,
  type LoadMeasurement,
} from '../../helpers/utils/useful-screen-ready';
import { useAfterPaint } from '../../hooks/useAfterPaint';

// Registered once at startup; isolated views do not emit measurements.
let measurement: LoadMeasurement | undefined;
let unsubscribe: (() => void) | undefined;

/**
 * Register the initial Unlock visit before rendering or loading the page.
 *
 * @param state - Initial wallet state.
 * @param state.isUnlocked
 * @param state.completedOnboarding
 * @param router - The application router.
 */
export function registerUnlockMeasurement(
  state: { isUnlocked: boolean; completedOnboarding: boolean },
  router: ReturnType<typeof createHashRouter>,
): void {
  measurement = undefined;
  const initialLocation = router.state.location;
  if (
    state.isUnlocked ||
    !state.completedOnboarding ||
    ![DEFAULT_ROUTE, UNLOCK_ROUTE].includes(initialLocation.pathname)
  ) {
    return;
  }

  measurement = registerDocumentLoadMeasurement({
    screen: 'unlock',
    tags: {
      'wallet.unlocked': state.isUnlocked,
      'wallet.ui_type': getEnvironmentType(),
    },
  });
  let locationKey = initialLocation.key;
  unsubscribe = router.subscribe(({ location: next, historyAction }) => {
    if (next.key === locationKey) {
      return;
    }
    // RequireAuthenticated redirects the initial root entry to Unlock and
    // preserves that entry in state.from, including StrictMode effect replay.
    if (
      initialLocation.pathname === DEFAULT_ROUTE &&
      next.pathname === UNLOCK_ROUTE &&
      historyAction === 'REPLACE' &&
      next.state?.from?.key === initialLocation.key
    ) {
      locationKey = next.key;
      return;
    }
    discardUnlockMeasurement();
  });
}

/** Permanently exclude this document from Unlock readiness sampling. */
export function discardUnlockMeasurement(): void {
  unsubscribe?.();
  measurement?.discard();
  measurement = undefined;
}

function reportReady(): void {
  unsubscribe?.();
  measurement?.reportReady();
  measurement = undefined;
}

/**
 * Report an idle form after a paint opportunity.
 *
 * @param props - Form readiness.
 * @param props.ready
 */
export function UnlockReady({ ready }: { ready: boolean }): null {
  useAfterPaint(ready, measurement ? reportReady : undefined);
  return null;
}
