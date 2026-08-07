import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getInternalOrderCode,
  RampsOrderStatus,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import {
  ACTIVITY_ROUTE,
  TX_DETAILS_ROUTE,
} from '../../helpers/constants/routes';
import { selectRampsOrdersForSelectedAccount } from '../../selectors/rampsController';
import { toast, ToastContent } from '../../components/ui/toast/toast';
import {
  clearToastPhase,
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from '../../components/app/toast-listener/toast-lifecycle';
import { useI18nContext } from '../useI18nContext';
import { mapRampsOrderSafely } from './utils/mapRampsOrderSafely';

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
 * Resolves the order details path, or Activity when chain/id is unknown.
 *
 * @param order - The order the toast belongs to.
 */
function getOrderDetailsPath(order: RampsOrder): string {
  const item = mapRampsOrderSafely(order);
  const identifier = item?.hash ?? getInternalOrderCode(order);

  if (item?.chainId && identifier) {
    return `${TX_DETAILS_ROUTE}/${item.chainId}/${identifier}`;
  }

  return ACTIVITY_ROUTE;
}

type RampsToastContentProps = {
  toastId: string;
  title: string;
  description: string;
  to: string;
};

const RampsToastContent = ({
  toastId,
  title,
  description,
  to,
}: RampsToastContentProps) => {
  return (
    <>
      <ToastContent title={title} description={description} />

      {to && (
        <Link
          to={to}
          aria-label={title}
          className="absolute inset-0 z-[1] cursor-pointer"
          onClick={() => toast.dismiss(toastId)}
        />
      )}
    </>
  );
};

/**
 * Toasts pending / success / failed on ramps order status transitions.
 */
export function useRampsOrderEventToasts(): void {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAccountAddress = selectedAccount?.address?.toLowerCase() ?? '';
  const previousStatusById = useRef<Map<string, RampsOrderStatus>>(new Map());
  const trackedAccountAddress = useRef(selectedAccountAddress);
  const t = useI18nContext();
  const initialized = useRef(false);

  useEffect(() => {
    if (trackedAccountAddress.current !== selectedAccountAddress) {
      for (const orderCode of previousStatusById.current.keys()) {
        clearToastPhase(orderCode);
        toast.dismiss(generateToastId(orderCode));
      }
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
        t,
      });
    }

    for (const orderCode of previous.keys()) {
      if (!next.has(orderCode)) {
        clearToastPhase(orderCode);
        toast.dismiss(generateToastId(orderCode));
      }
    }

    previousStatusById.current = next;
    initialized.current = true;
  }, [orders, selectedAccountAddress, t]);
}

function handleOrderStatusChange({
  order,
  orderCode,
  previousStatus,
  t,
}: {
  order: RampsOrder;
  orderCode: string;
  previousStatus: RampsOrderStatus | undefined;
  t: ReturnType<typeof useI18nContext>;
}) {
  if (previousStatus === order.status) {
    return;
  }

  const toastId = generateToastId(orderCode);
  const copy = getToastCopy(order, t);
  const to = getOrderDetailsPath(order);
  const getToastContent = (title: string, description: string) => (
    <RampsToastContent
      toastId={toastId}
      title={title}
      description={description}
      to={to}
    />
  );

  const becameInProgress =
    IN_PROGRESS.has(order.status) &&
    (previousStatus === undefined ||
      previousStatus === RampsOrderStatus.Precreated);

  if (becameInProgress && shouldShowPendingToast(orderCode)) {
    toast.loading(getToastContent(copy.pendingTitle, copy.pendingDescription), {
      id: toastId,
    });
    return;
  }

  if (order.status === RampsOrderStatus.Completed) {
    // Ensure the pending phase is recorded so a terminal toast is allowed.
    shouldShowPendingToast(orderCode);
    if (shouldShowTerminalToast(orderCode)) {
      toast.success(
        getToastContent(copy.successTitle, copy.successDescription),
        { id: toastId },
      );
    }
    return;
  }

  if (TERMINAL_FAILED.has(order.status)) {
    shouldShowPendingToast(orderCode);
    if (shouldShowTerminalToast(orderCode)) {
      toast.error(getToastContent(copy.failedTitle, copy.failedDescription), {
        id: toastId,
      });
    }
  }
}
