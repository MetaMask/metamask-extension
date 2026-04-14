import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../helpers/utils/transaction-display';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';
import {
  selectBridgeHistoryToastStates,
  selectBridgeSmartStatusToastStates,
  type BridgeHistoryToastState,
  type BridgeSmartStatusToastState,
} from '../../selectors/toast';
import {
  isBridgeToastTracked,
  trackBridgeToast,
  untrackBridgeToast,
} from './bridgeToastState';

const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={title} />;
};

export function useBridgeSmartStatusToasts() {
  const bridgeSmartStatusToasts = useSelector(
    selectBridgeSmartStatusToastStates,
  ) as BridgeSmartStatusToastState[];
  const bridgeHistoryToasts = useSelector(
    selectBridgeHistoryToastStates,
  ) as BridgeHistoryToastState[];

  // Remembers the last smart-status value per toast so we only react to real transitions.
  const previousStatusesRef = useRef<Record<string, string | undefined>>({});

  // Start bridge pending toasts from the smart-status approval while it is still visible.
  useEffect(() => {
    const nextStatuses: Record<string, string | undefined> = {};

    for (const toastState of bridgeSmartStatusToasts) {
      nextStatuses[toastState.toastId] = toastState.status;
      const previousStatus = previousStatusesRef.current[toastState.toastId];

      if (previousStatus === undefined && toastState.isPending) {
        trackBridgeToast(toastState.toastId);
        toast.loading(<ToastContent status="pending" />, {
          id: toastState.toastId,
        });
      }
    }

    previousStatusesRef.current = nextStatuses;
  }, [bridgeSmartStatusToasts]);

  // Resolve in-flight bridge toasts from bridge history, which persists after the approval disappears.
  useEffect(() => {
    for (const toastState of bridgeHistoryToasts) {
      if (!isBridgeToastTracked(toastState.toastId)) {
        continue;
      }

      if (toastState.isSuccess) {
        toast.success(<ToastContent status="success" />, {
          id: toastState.toastId,
        });
        untrackBridgeToast(toastState.toastId);
        continue;
      }

      if (toastState.isFailed) {
        toast.error(<ToastContent status="failed" />, {
          id: toastState.toastId,
        });
        untrackBridgeToast(toastState.toastId);
      }
    }
  }, [bridgeHistoryToasts]);
}
