import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getInternalOrderCode,
  RampsOrderStatus,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { ACTIVITY_ROUTE } from '../../../helpers/constants/routes';
import { selectRampsOrdersForSelectedAccount } from '../../../selectors/rampsController';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
} from './shared';
import {
  clearToastPhase,
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from './toast-lifecycle';

const ACTIVITY_BUY_SELL_FILTER = 'buySell';

const TERMINAL_FAILED = new Set<RampsOrderStatus>([
  RampsOrderStatus.Failed,
  RampsOrderStatus.Cancelled,
  RampsOrderStatus.IdExpired,
]);

const IN_PROGRESS = new Set<RampsOrderStatus>([
  RampsOrderStatus.Created,
  RampsOrderStatus.Pending,
  RampsOrderStatus.Unknown,
]);

const generateToastId = (orderCode: string) => `ramp-${orderCode}`;

function navigateToBuySellActivity(navigate: ReturnType<typeof useNavigate>) {
  navigate(ACTIVITY_ROUTE, {
    state: { activityFilter: ACTIVITY_BUY_SELL_FILTER },
  });
}

/**
 * Watches RampsController orders in Redux and shows pending / success / failed
 * toasts on status transitions. Covers both poll-driven updates (including
 * PRECREATED → PENDING) and redirect-resolved addOrder inserts.
 *
 * Initial PRECREATED seeds from Continue do not toast — that path already
 * showed the "opened in a new tab" toast.
 */
export function useRampsOrderEventToasts(): void {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);
  const previousStatusById = useRef<Map<string, RampsOrderStatus>>(new Map());
  const navigate = useNavigate();
  const t = useI18nContext();
  const initialized = useRef(false);

  useEffect(() => {
    const previous = previousStatusById.current;
    const next = new Map<string, RampsOrderStatus>();

    for (const order of orders) {
      const orderCode = getInternalOrderCode(order);
      if (!orderCode) {
        continue;
      }
      next.set(orderCode, order.status);

      const previousStatus = previous.get(orderCode);
      // First pass after mount: seed the map without toasting historical
      // orders already in state (e.g. after unlock / page reload).
      if (!initialized.current) {
        continue;
      }

      handleOrderStatusChange({
        order,
        orderCode,
        previousStatus,
        navigate,
        t,
      });
    }

    // Drop toast phase for orders that disappeared (removed / account switch).
    for (const orderCode of previous.keys()) {
      if (!next.has(orderCode)) {
        clearToastPhase(orderCode);
        dismissToast(generateToastId(orderCode));
      }
    }

    previousStatusById.current = next;
    initialized.current = true;
  }, [navigate, orders, t]);
}

function handleOrderStatusChange({
  order,
  orderCode,
  previousStatus,
  navigate,
  t,
}: {
  order: RampsOrder;
  orderCode: string;
  previousStatus: RampsOrderStatus | undefined;
  navigate: ReturnType<typeof useNavigate>;
  t: ReturnType<typeof useI18nContext>;
}) {
  if (previousStatus === order.status) {
    return;
  }

  const toastId = generateToastId(orderCode);
  const onActionClick = () => navigateToBuySellActivity(navigate);
  const action = {
    actionText: t('rampsOrderToastView'),
    onActionClick,
  };

  // Fresh redirect-resolved order, or poll left PRECREATED — pending toast.
  const becameInProgress =
    IN_PROGRESS.has(order.status) &&
    (previousStatus === undefined ||
      previousStatus === RampsOrderStatus.Precreated);

  if (becameInProgress && shouldShowPendingToast(orderCode)) {
    showPendingToast(toastId, {
      ...action,
      title: t('rampsOrderToastPendingTitle'),
      description: t('rampsOrderToastPendingDescription'),
    });
    return;
  }

  if (order.status === RampsOrderStatus.Completed) {
    // Seed the pending phase if we never toasted one (e.g. PRECREATED →
    // COMPLETED in a single poll) so the terminal guard still allows success.
    shouldShowPendingToast(orderCode);
    if (shouldShowTerminalToast(orderCode)) {
      showSuccessToast(toastId, {
        ...action,
        title: t('rampsOrderToastSuccessTitle'),
        description: t('rampsOrderToastSuccessDescription'),
      });
    }
    return;
  }

  if (TERMINAL_FAILED.has(order.status)) {
    shouldShowPendingToast(orderCode);
    if (shouldShowTerminalToast(orderCode)) {
      showFailedToast(toastId, {
        ...action,
        title: t('rampsOrderToastFailedTitle'),
        description: t('rampsOrderToastFailedDescription'),
      });
    }
  }
}
