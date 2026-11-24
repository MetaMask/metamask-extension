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
import { CONFIRMATION_APPROVAL_TYPES } from './selectors/confirmation-approval-types';

let measurement: LoadMeasurement | undefined;
let unsubscribe: (() => void) | undefined;
let initialRequestId: string | undefined;

/**
 * Measure the initial UI document load when an unlocked, onboarded wallet
 * starts with a transaction confirmation. Later confirmations in the same
 * document, including queued requests and requests shown after unlock, are
 * excluded. Readiness is the transaction info after a paint opportunity; it
 * does not wait for optional enrichment or the confirm button to be enabled.
 *
 * @param state - Initial wallet state.
 * @param state.isUnlocked
 * @param state.completedOnboarding
 * @param state.pendingApprovals
 * @param router - The application router.
 */
export function registerInitialTransactionConfirmationMeasurement(
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
    : Object.values(state.pendingApprovals ?? {})
        // An ID-less confirmation route skips approvals that its screen cannot show.
        // The root route instead follows the full pending-approval navigation queue.
        .filter(
          ({ type }) => !match || CONFIRMATION_APPROVAL_TYPES.includes(type),
        )
        .sort((a, b) => a.time - b.time)[0];
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
 * Report the initial transaction info after a paint opportunity, without
 * waiting for optional enrichment or the confirm button to be enabled.
 *
 * @param confirmation - The confirmation whose info is being rendered.
 */
export function useInitialTransactionConfirmationReady(
  confirmation?: Confirmation,
): void {
  useAfterPaint(
    Boolean(
      confirmation?.type &&
      'txParams' in confirmation &&
      confirmation.id === initialRequestId,
    ),
    measurement ? reportReady : undefined,
  );
}
