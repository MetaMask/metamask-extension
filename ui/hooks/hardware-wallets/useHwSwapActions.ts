import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  ConnectionStatus,
  useHardwareWalletState,
} from '../../contexts/hardware-wallets';
import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { cleanupPendingApproval } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { UseHwSwapActionsOptions } from './useHwSwapActions.types';

/**
 * Hardware wallet connection statuses that permit a retry. The device must be
 * connected (or in a recoverable error/awaiting state) before resubmitting.
 */
const RETRYABLE_CONNECTION_STATUSES = new Set<ConnectionStatus>([
  ConnectionStatus.Connected,
  ConnectionStatus.Ready,
  ConnectionStatus.AwaitingConfirmation,
  ConnectionStatus.ErrorState,
]);

/**
 * Owns retry and cancel actions for the hardware-wallet signing-progress screen.
 *
 * `handleRetry` cancels the current batch, resets the signature state machine,
 * and re-submits (bridge quote or sendBundle). `handleCancel` aborts the batch,
 * stops QR scanning, cleans up sendBundle approvals when needed, and navigates
 * away.
 *
 * @param options - Configuration for the actions hook.
 * @param options.signatureState
 * @param options.dispatchSignatureEvent
 * @param options.cancelCurrentBatch
 * @param options.resetConnectionError
 * @param options.retryGenerationRef
 * @param options.needsTwoConfirmations
 * @param options.isStxEnabled
 * @param options.isSendBundleFlow
 * @param options.hasStartedSendBundleSubmission
 * @param options.retrySendBundleSubmission
 * @param options.retrySubmission
 * @param options.handleQrSignatureCancel
 * @param options.currentApprovalRequestId
 * @param options.returnRoute
 * @param options.isRetryingRef
 * @returns Retry/cancel handlers plus retry UI state (`isRetrying`,
 * `hasRetriedRef`).
 */
export function useHwSwapActions({
  signatureState,
  dispatchSignatureEvent,
  cancelCurrentBatch,
  resetConnectionError,
  retryGenerationRef,
  needsTwoConfirmations,
  isStxEnabled,
  isSendBundleFlow,
  hasStartedSendBundleSubmission,
  retrySendBundleSubmission,
  retrySubmission,
  handleQrSignatureCancel,
  currentApprovalRequestId,
  returnRoute,
  isRetryingRef,
}: UseHwSwapActionsOptions) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { navigateToBridgePage } = useBridgeNavigation();
  const { connectionState } = useHardwareWalletState();

  // Tracks whether the user has retried at least once. Once true, the
  // "Resend transaction" button becomes eligible after the stuck timeout.
  const hasRetriedRef = useRef(false);
  // Local re-entrancy guard for handleRetry. Distinct from `isRetryingRef`,
  // which only suppresses OLD-batch reject/fail while cancelCurrentBatch runs.
  const isRetryInFlightRef = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Retries the hardware wallet signing flow after a rejection, failure, or
   * device disconnection. Cancels the current batch, resets the state machine,
   * and re-submits the bridge transaction.
   */
  const handleRetry = useCallback(async () => {
    if (isRetryInFlightRef.current) {
      return;
    }

    isRetryInFlightRef.current = true;
    // Suppress reject/fail from the cancelled batch only — cleared before
    // resubmit so the new attempt can update the signature state machine.
    isRetryingRef.current = true;
    hasRetriedRef.current = true;
    setIsRetrying(true);

    try {
      // Invalidate the in-flight attempt so abort events during cancel are ignored.
      retryGenerationRef.current += 1;

      await cancelCurrentBatch();

      const canRetry = RETRYABLE_CONNECTION_STATUSES.has(
        connectionState.status,
      );

      if (!canRetry) {
        return;
      }

      // Fresh generation for the resubmit (skips anything tracked during cancel).
      retryGenerationRef.current += 1;
      resetConnectionError();
      if (isStxEnabled) {
        dispatchSignatureEvent({
          type: HardwareWalletSignatureEvent.Reset,
          needsTwoConfirmations,
        });
      } else {
        let savedStep: HardwareWalletSignatureStatus | undefined;
        if (signatureState.status === HardwareWalletSignatureStatus.Rejected) {
          savedStep = signatureState.rejectedSignature;
        } else if (
          signatureState.status === HardwareWalletSignatureStatus.Failed
        ) {
          savedStep = signatureState.failedSignature;
        } else if (
          signatureState.status === HardwareWalletSignatureStatus.Disconnected
        ) {
          savedStep = signatureState.disconnectedSignature;
        }

        // Resume at the final step when retrying from a terminal state that
        // interrupted there, OR when already awaiting the final signature
        // (stuck "Resend transaction" path). Resetting would rewind the UI to
        // the approval step while firstSignatureDone still skips approval.
        const shouldResumeFinalSignature =
          savedStep === HardwareWalletSignatureStatus.AwaitingFinalSignature ||
          signatureState.status ===
            HardwareWalletSignatureStatus.AwaitingFinalSignature;

        if (shouldResumeFinalSignature) {
          dispatchSignatureEvent({
            type: HardwareWalletSignatureEvent.Retry,
          });
        } else {
          dispatchSignatureEvent({
            type: HardwareWalletSignatureEvent.Reset,
            needsTwoConfirmations,
          });
        }
      }
      // Allow the new submission's reject/fail to reach the state machine via
      // `isRetryingRef`. Stale rejects from the aborted batch that settle after
      // this clear are ignored by the submission catch handlers when their
      // captured `retryGenerationRef` no longer matches (bumped above).
      // `retrySubmission` swallows the rethrown error after that dispatch.
      isRetryingRef.current = false;
      if (isSendBundleFlow) {
        hasStartedSendBundleSubmission.current = true;
        await retrySendBundleSubmission();
      } else {
        await retrySubmission();
      }
    } finally {
      isRetryingRef.current = false;
      isRetryInFlightRef.current = false;
      setIsRetrying(false);
    }
  }, [
    cancelCurrentBatch,
    connectionState.status,
    dispatchSignatureEvent,
    hasStartedSendBundleSubmission,
    isRetryingRef,
    isSendBundleFlow,
    isStxEnabled,
    needsTwoConfirmations,
    resetConnectionError,
    retryGenerationRef,
    retrySendBundleSubmission,
    retrySubmission,
    signatureState,
  ]);

  /**
   * Cancels the hardware wallet signing flow. Aborts the current batch, stops
   * any active QR scan, and navigates away.
   *
   * For the sendBundle (send) flow, the pending approval is also rejected so
   * the confirmation does not linger, then the user returns to the start of
   * the send flow. For the bridge/swap flow, navigates back to the bridge page.
   */
  const handleCancel = useCallback(async () => {
    await cancelCurrentBatch();
    handleQrSignatureCancel();
    if (isSendBundleFlow) {
      // Reject the pending approval so the confirmation is cleaned up and
      // does not linger after navigating back to the send flow.
      if (currentApprovalRequestId) {
        cleanupPendingApproval(dispatch, currentApprovalRequestId);
      }
      navigate(returnRoute ?? DEFAULT_ROUTE, {
        replace: true,
      });
      return;
    }
    navigateToBridgePage();
  }, [
    cancelCurrentBatch,
    currentApprovalRequestId,
    dispatch,
    handleQrSignatureCancel,
    isSendBundleFlow,
    navigate,
    navigateToBridgePage,
    returnRoute,
  ]);

  return {
    handleRetry,
    handleCancel,
    isRetrying,
    hasRetriedRef,
  };
}
