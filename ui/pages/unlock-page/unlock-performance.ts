import { createContext, useContext } from 'react';
import type { createHashRouter } from 'react-router-dom';
import type { EnvironmentType } from '../../../shared/constants/app';
import { DEFAULT_ROUTE, UNLOCK_ROUTE } from '../../helpers/constants/routes';
import {
  registerDocumentLoadMeasurement,
  type LoadMeasurement,
} from '../../helpers/utils/useful-screen-ready';
import { useAfterPaint } from '../../hooks/useAfterPaint';

// Isolated views without startup registration do not emit measurements.
export const UnlockMeasurementContext = createContext<
  LoadMeasurement | undefined
>(undefined);

/**
 * Register the initial Unlock visit before rendering or loading the page.
 *
 * @param options - Initial wallet state and the application router.
 * @param options.isUnlocked
 * @param options.completedOnboarding
 * @param options.uiType
 * @param options.router
 */
export function registerUnlockMeasurement({
  isUnlocked,
  completedOnboarding,
  uiType,
  router,
}: {
  isUnlocked: boolean;
  completedOnboarding: boolean;
  uiType: EnvironmentType;
  router: ReturnType<typeof createHashRouter>;
}): LoadMeasurement | undefined {
  const initialLocation = router.state.location;
  if (
    isUnlocked ||
    !completedOnboarding ||
    ![DEFAULT_ROUTE, UNLOCK_ROUTE].includes(initialLocation.pathname)
  ) {
    return undefined;
  }

  const measurement = registerDocumentLoadMeasurement({
    screen: 'unlock',
    tags: { 'wallet.unlocked': isUnlocked, 'wallet.ui_type': uiType },
  });
  let locationKey = initialLocation.key;
  const unsubscribe = router.subscribe(({ location: next, historyAction }) => {
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
    discard();
  });

  function discard() {
    unsubscribe();
    measurement.discard();
  }

  return {
    discard,
    reportReady() {
      unsubscribe();
      measurement.reportReady();
    },
  };
}

/**
 * Readiness marker for the existing class-based password form.
 *
 * @param props - Form readiness.
 * @param props.ready
 */
export function UnlockReady({ ready }: { ready: boolean }): null {
  const measurement = useContext(UnlockMeasurementContext);
  useAfterPaint(ready, measurement?.reportReady);
  return null;
}
