import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getInternalOrderCode,
  RampsOrderStatus,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import {
  ACTIVITY_ROUTE,
  TX_DETAILS_ROUTE,
} from '../../../helpers/constants/routes';
import { selectRampsOrdersForSelectedAccount } from '../../../selectors/rampsController';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mapRampsOrderSafely } from '../../../hooks/ramps/utils/mapRampsOrderSafely';
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

function isSellOrder(order: RampsOrder): boolean {
  return order.orderType?.toUpperCase() === 'SELL';
}

function getToastCopy(
  order: RampsOrder,
  t: ReturnType<typeof useI18nContext>,
): {
  pendingTitle: string;
  pendingDescription: string;
  successTitle: string;
  successDescription: string;
  failedTitle: string;
  failedDescription: string;
} {
  if (isSellOrder(order)) {
    return {
      pendingTitle: t('rampsOrderToastSellPendingTitle'),
      pendingDescription: t('rampsOrderToastSellPendingDescription'),
      successTitle: t('rampsOrderToastSellSuccessTitle'),
      successDescription: t('rampsOrderToastSellSuccessDescription'),
      failedTitle: t('rampsOrderToastSellFailedTitle'),
      failedDescription: t('rampsOrderToastSellFailedDescription'),
    };
  }

  return {
    pendingTitle: t('rampsOrderToastPendingTitle'),
    pendingDescription: t('rampsOrderToastPendingDescription'),
    successTitle: t('rampsOrderToastSuccessTitle'),
    successDescription: t('rampsOrderToastSuccessDescription'),
    failedTitle: t('rampsOrderToastFailedTitle'),
    failedDescription: t('rampsOrderToastFailedDescription'),
  };
}

/**
 * Navigates to order details, or Activity when chain/id is unknown.
 *
 * @param navigate - Router navigate function.
 * @param order - The order the toast belongs to.
 */
function navigateToOrder(
  navigate: ReturnType<typeof useNavigate>,
  order: RampsOrder,
) {
  const item = mapRampsOrderSafely(order);
  const identifier = item?.hash ?? getInternalOrderCode(order);

  if (item?.chainId && identifier) {
    navigate(`${TX_DETAILS_ROUTE}/${item.chainId}/${identifier}`);
    return;
  }

  navigate(ACTIVITY_ROUTE);
}

/**
 * Toasts pending / success / failed on ramps order status transitions.
 */
export function useRampsOrderEventToasts(): void {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAccountAddress = selectedAccount?.address?.toLowerCase() ?? '';
  const previousStatusById = useRef<Map<string, RampsOrderStatus>>(new Map());
  const trackedAccountAddress = useRef(selectedAccountAddress);
  const ordersRef = useRef(orders);
  const navigate = useNavigate();
  const t = useI18nContext();
  const initialized = useRef(false);

  useEffect(() => {
    ordersRef.current = orders;

    if (trackedAccountAddress.current !== selectedAccountAddress) {
      trackedAccountAddress.current = selectedAccountAddress;
      previousStatusById.current = new Map();
      initialized.current = false;
    }

    const previous = previousStatusById.current;
    const next = new Map<string, RampsOrderStatus>();

    for (const order of orders) {
      const orderCode = getInternalOrderCode(order);
      if (!orderCode) {
        continue;
      }
      next.set(orderCode, order.status);

      const previousStatus = previous.get(orderCode);
      // Seed existing statuses on mount / account switch without toasting them.
      if (!initialized.current) {
        continue;
      }

      handleOrderStatusChange({
        order,
        orderCode,
        previousStatus,
        navigate,
        t,
        // Resolve the navigation target at click time.
        getLatestOrder: (code: string) =>
          ordersRef.current.find(
            (candidate) => getInternalOrderCode(candidate) === code,
          ),
      });
    }

    for (const orderCode of previous.keys()) {
      if (!next.has(orderCode)) {
        clearToastPhase(orderCode);
        dismissToast(generateToastId(orderCode));
      }
    }

    previousStatusById.current = next;
    initialized.current = true;
  }, [navigate, orders, selectedAccountAddress, t]);
}

function handleOrderStatusChange({
  order,
  orderCode,
  previousStatus,
  navigate,
  t,
  getLatestOrder,
}: {
  order: RampsOrder;
  orderCode: string;
  previousStatus: RampsOrderStatus | undefined;
  navigate: ReturnType<typeof useNavigate>;
  t: ReturnType<typeof useI18nContext>;
  getLatestOrder: (orderCode: string) => RampsOrder | undefined;
}) {
  if (previousStatus === order.status) {
    return;
  }

  const toastId = generateToastId(orderCode);
  const copy = getToastCopy(order, t);
  const onActionClick = () =>
    navigateToOrder(navigate, getLatestOrder(orderCode) ?? order);
  const action = {
    actionText: t('rampsOrderToastView'),
    onActionClick,
  };

  const becameInProgress =
    IN_PROGRESS.has(order.status) &&
    (previousStatus === undefined ||
      previousStatus === RampsOrderStatus.Precreated);

  if (becameInProgress && shouldShowPendingToast(orderCode)) {
    showPendingToast(toastId, {
      ...action,
      title: copy.pendingTitle,
      description: copy.pendingDescription,
    });
    return;
  }

  if (order.status === RampsOrderStatus.Completed) {
    // Ensure the pending phase is recorded so a terminal toast is allowed.
    shouldShowPendingToast(orderCode);
    if (shouldShowTerminalToast(orderCode)) {
      showSuccessToast(toastId, {
        ...action,
        title: copy.successTitle,
        description: copy.successDescription,
      });
    }
    return;
  }

  if (TERMINAL_FAILED.has(order.status)) {
    shouldShowPendingToast(orderCode);
    if (shouldShowTerminalToast(orderCode)) {
      showFailedToast(toastId, {
        ...action,
        title: copy.failedTitle,
        description: copy.failedDescription,
      });
    }
  }
}
