import type { createHashRouter } from 'react-router-dom';
import { AccountOverviewTabKey } from '../../../shared/constants/app-state';
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
 * Register an initial Home Tokens-tab visit before React renders.
 * URL tab selection takes precedence over the saved preference; no selection
 * defaults to Tokens. Other initial tabs and approval redirects are excluded.
 * Changing the location before readiness permanently excludes the document.
 *
 * @param state - Initial wallet state.
 * @param state.isUnlocked
 * @param state.completedOnboarding
 * @param state.pendingApprovals
 * @param state.approvalFlows
 * @param state.defaultHomeActiveTabName
 * @param router - The application router.
 */
export function registerHomeMeasurement(
  state: {
    isUnlocked: boolean;
    completedOnboarding: boolean;
    pendingApprovals?: Record<string, unknown>;
    approvalFlows?: readonly unknown[];
    defaultHomeActiveTabName?: AccountOverviewTabKey | null;
  },
  router: ReturnType<typeof createHashRouter>,
): void {
  unsubscribe?.();
  unsubscribe = undefined;
  measurement = undefined;
  const initialLocation = router.state.location;
  const initialTab =
    new URLSearchParams(initialLocation.search).get('tab') ||
    state.defaultHomeActiveTabName ||
    AccountOverviewTabKey.Tokens;
  if (
    !state.isUnlocked ||
    !state.completedOnboarding ||
    initialLocation.pathname !== DEFAULT_ROUTE ||
    Object.keys(state.pendingApprovals ?? {}).length > 0 ||
    (state.approvalFlows?.length ?? 0) > 0 ||
    initialTab !== AccountOverviewTabKey.Tokens
  ) {
    return;
  }

  measurement = registerDocumentLoadMeasurement({
    screen: 'home',
    tags: {
      'wallet.unlocked': true,
      'wallet.ui_type': getEnvironmentType(),
      'home.tab': initialTab,
    },
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
 * Report the initial Home Tokens tab after its content has a paint opportunity,
 * including persisted content during refresh.
 *
 * @param ready - Whether the selected account has content instead of skeletons.
 */
export function useHomeReady(ready: boolean): void {
  useAfterPaint(ready, measurement ? reportReady : undefined);
}
