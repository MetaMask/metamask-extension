import { ApprovalType } from '@metamask/controller-utils';
import { matchPath, type createHashRouter } from 'react-router-dom';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  registerDocumentLoadMeasurement,
  type LoadMeasurement,
} from '../../helpers/utils/useful-screen-ready';
import { useAfterPaint } from '../../hooks/useAfterPaint';
import type { Confirmation } from './types/confirm';

let measurement: LoadMeasurement | undefined;
let unsubscribe: (() => void) | undefined;
let initialRequestId: string | undefined;

/**
 * Register the initial transaction before rendering or loading its lazy page.
 *
 * @param state - Initial wallet state.
 * @param state.isUnlocked
 * @param state.completedOnboarding
 * @param state.pendingApprovals
 * @param router - The application router.
 */
export function registerConfirmationMeasurement(
  state: {
    isUnlocked: boolean;
    completedOnboarding: boolean;
    pendingApprovals?: Record<
      string,
      { id: string; type: string; time: number }
    >;
  },
  router: ReturnType<typeof createHashRouter>,
): void {
  measurement = undefined;
  const initialLocation = router.state.location;
  const match = matchPath(
    `${CONFIRM_TRANSACTION_ROUTE}/:id?`,
    initialLocation.pathname,
  );
  if (
    !state.isUnlocked ||
    !state.completedOnboarding ||
    (!match && initialLocation.pathname !== DEFAULT_ROUTE)
  ) {
    return;
  }
  const approval = match?.params.id
    ? state.pendingApprovals?.[match.params.id]
    : Object.values(state.pendingApprovals ?? {}).sort(
        (a, b) => a.time - b.time,
      )[0];
  if (approval?.type !== ApprovalType.Transaction) {
    return;
  }

  initialRequestId = approval.id; // Kept local; never included in telemetry.
  measurement = registerDocumentLoadMeasurement({
    screen: 'confirmation',
    tags: { 'wallet.unlocked': true, 'wallet.ui_type': getEnvironmentType() },
  });
  const target = `${CONFIRM_TRANSACTION_ROUTE}/${approval.id}`;
  let locationKey = initialLocation.key;
  unsubscribe = router.subscribe(({ location, historyAction }) => {
    if (location.key === locationKey) {
      return;
    }
    // Notification windows start at /; useSyncConfirmPath also fills a missing id.
    if (
      initialLocation.pathname !== target &&
      historyAction === 'REPLACE' &&
      location.pathname === target
    ) {
      locationKey = location.key;
      return;
    }
    unsubscribe?.();
    measurement?.discard();
    measurement = undefined;
  });
}

function reportReady(): void {
  unsubscribe?.();
  measurement?.reportReady();
  measurement = undefined;
}

/**
 * Report the initial transaction's info commit without waiting for enrichment.
 *
 * @param confirmation - The confirmation whose info is being rendered.
 */
export function useConfirmationReady(confirmation?: Confirmation): void {
  useAfterPaint(
    Boolean(
      confirmation?.type &&
      'txParams' in confirmation &&
      confirmation.id === initialRequestId,
    ),
    measurement ? reportReady : undefined,
  );
}
