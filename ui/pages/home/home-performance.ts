import type { createHashRouter } from 'react-router-dom';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  registerDocumentLoadMeasurement,
  type LoadMeasurement,
} from '../../helpers/utils/useful-screen-ready';
import { useAfterPaint } from '../../hooks/useAfterPaint';

let measurement: LoadMeasurement | undefined;
let unsubscribe: (() => void) | undefined;

/**
 * Register an initial Home visit before React renders.
 *
 * @param state - Initial wallet state.
 * @param state.isUnlocked
 * @param state.completedOnboarding
 * @param state.pendingApprovals
 * @param router - The application router.
 */
export function registerHomeMeasurement(
  state: {
    isUnlocked: boolean;
    completedOnboarding: boolean;
    pendingApprovals?: Record<string, unknown>;
  },
  router: ReturnType<typeof createHashRouter>,
): void {
  measurement = undefined;
  const initialLocation = router.state.location;
  if (
    !state.isUnlocked ||
    !state.completedOnboarding ||
    initialLocation.pathname !== DEFAULT_ROUTE ||
    Object.keys(state.pendingApprovals ?? {}).length > 0
  ) {
    return;
  }

  measurement = registerDocumentLoadMeasurement({
    screen: 'home',
    tags: { 'wallet.unlocked': true, 'wallet.ui_type': getEnvironmentType() },
  });
  unsubscribe = router.subscribe(({ location }) => {
    if (location.key !== initialLocation.key) {
      unsubscribe?.();
      measurement?.discard();
      measurement = undefined;
    }
  });
}

function reportReady(): void {
  unsubscribe?.();
  measurement?.reportReady();
  measurement = undefined;
}

/**
 * Report committed token content, including persisted content during refresh.
 *
 * @param ready - Whether the selected account has content instead of skeletons.
 */
export function useHomeReady(ready: boolean): void {
  useAfterPaint(ready, measurement ? reportReady : undefined);
}
