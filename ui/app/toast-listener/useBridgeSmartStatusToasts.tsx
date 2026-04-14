import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  selectBridgeHistoryToastStates,
  selectBridgeSmartStatusToastStates,
  type BridgeHistoryToastState,
  type BridgeSmartStatusToastState,
} from '../../selectors/toast';
// import {
//   isBridgeToastTracked,
//   trackBridgeToast,
//   untrackBridgeToast,
// } from './bridgeToastState';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';

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
        // trackBridgeToast(toastState.toastId);
        // showPendingToast(toastState.toastId);
      }
    }

    previousStatusesRef.current = nextStatuses;
  }, [bridgeSmartStatusToasts]);

  // Resolve in-flight bridge toasts from bridge history, which persists after the approval disappears.
  // useEffect(() => {
  //   for (const toastState of bridgeHistoryToasts) {
  //     // if (!isBridgeToastTracked(toastState.toastId)) {
  //     //   continue;
  //     // }

  //     if (toastState.isSuccess) {
  //       showSuccessToast(toastState.toastId);
  //       // untrackBridgeToast(toastState.toastId);
  //       continue;
  //     }

  //     if (toastState.isFailed) {
  //       showFailedToast(toastState.toastId);
  //       // untrackBridgeToast(toastState.toastId);
  //     }
  //   }
  // }, [bridgeHistoryToasts]);
}
