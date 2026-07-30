import { useCallback } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  updateAndApproveTx,
} from '../../../../store/actions';
import { isUserRejectedHardwareWalletError } from '../../../../contexts/hardware-wallets';
import { cleanupPendingApproval } from '../hardware-wallet-signatures.utils';
import { HardwareWalletSignatureEvent } from '../hardware-wallet-signatures-state-machine';
import type {
  UseSendBundleSubmissionOptions,
  UseSendBundleSubmissionReturn,
} from './useSendBundleSubmission.types';

/**
 * Owns sendBundle transaction submission and retry for the hardware-wallet
 * signing-progress screen.
 *
 * `submitSendBundleTransaction` approves the tx captured at navigation time,
 * triggering device signing. It refuses to submit unless the pending approval
 * is still pending (wallet-safety guard against stale navigation state).
 *
 * `retrySendBundleSubmission` recreates the tx from scratch after a rejection
 * or failure (a terminal tx cannot be re-approved), copies the batch + gas
 * params onto the fresh txMeta, updates reactive state so the tracker and
 * safety guard track the new tx, then approves it.
 *
 * Both callbacks translate reject/fail outcomes into signature state-machine
 * events unless the attempt is stale (cancel-during-retry in flight, or retry
 * advanced `retryGenerationRef` after the submission started).
 *
 * @param options - Configuration for the submission hook.
 * @param options.sendBundleTxMeta
 * @param options.setSendBundleTxMeta
 * @param options.currentApprovalRequestId
 * @param options.setCurrentApprovalRequestId
 * @param options.expectedSendBundleApproval
 * @param options.retryGenerationRef
 * @param options.dispatchSignatureEvent
 * @param options.isStaleAttempt
 * @param options.dispatch
 * @returns `submitSendBundleTransaction` and `retrySendBundleSubmission`.
 */
export function useSendBundleSubmission({
  sendBundleTxMeta,
  setSendBundleTxMeta,
  currentApprovalRequestId,
  setCurrentApprovalRequestId,
  expectedSendBundleApproval,
  retryGenerationRef,
  dispatchSignatureEvent,
  isStaleAttempt,
  dispatch,
}: UseSendBundleSubmissionOptions): UseSendBundleSubmissionReturn {
  const submitSendBundleTransaction = useCallback(async () => {
    if (!sendBundleTxMeta) {
      return;
    }

    // WALLET SAFETY: refuse to submit unless the pending approval captured at
    // navigation time is still pending. Prevents signing a stale txMeta after
    // back/forward navigation, multi-tab races, or other stale-nav-state
    // scenarios. Ported from mobile:
    // https://github.com/MetaMask/metamask-mobile/blob/a7384b14df1fe540767ccc08c96b23785c1af965/app/components/UI/HardwareWallet/Swaps/useHardwareWalletSubmit.ts#L123-L142
    if (!expectedSendBundleApproval) {
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
      return;
    }

    const submissionGeneration = retryGenerationRef.current;

    try {
      await dispatch(updateAndApproveTx(sendBundleTxMeta, true, ''));
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    } catch (error) {
      if (isStaleAttempt(submissionGeneration)) {
        return;
      }

      if (isUserRejectedHardwareWalletError(error)) {
        dispatchSignatureEvent({
          type: HardwareWalletSignatureEvent.TransactionRejected,
        });
        return;
      }

      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    }
  }, [
    currentApprovalRequestId,
    dispatch,
    dispatchSignatureEvent,
    expectedSendBundleApproval,
    isStaleAttempt,
    sendBundleTxMeta,
  ]);

  /**
   * Recreates the sendBundle transaction batch after a rejection or failure.
   *
   * A tx in a terminal state (signed / rejected / failed) cannot be
   * re-approved — `updateAndApproveTx` would silently no-op. Instead this
   * function rejects the old pending approval, creates a FRESH transaction
   * via `addTransaction` with the original `txParams`, copies
   * `batchTransactions` (the gas-payment tx params) and aggregate gas fields
   * onto the new txMeta (same logic as `handleSmartTransaction`), updates the
   * reactive `sendBundleTxMeta` / `currentApprovalRequestId` state so the
   * tracker and safety check track the new tx, then calls
   * `updateAndApproveTx` to trigger device signing.
   *
   * The tracker's `expectedTxIdSet` automatically picks up the new tx ID on
   * the next render (state update flushes before the `await` resolves), so
   * events from the new batch are correctly matched.
   */
  const retrySendBundleSubmission = useCallback(async () => {
    if (!sendBundleTxMeta) {
      return;
    }

    const { chainId } = sendBundleTxMeta;
    if (!chainId) {
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
      return;
    }

    // 1. Reject the old approval (cleanup) — may already be resolved.
    if (currentApprovalRequestId) {
      cleanupPendingApproval(dispatch, currentApprovalRequestId);
    }

    // 2. Find the network client for this chain.
    const networkClientId = await findNetworkClientIdByChainId(chainId);

    // 3. Create a NEW transaction with the original send params.
    const newTxMeta = await addTransaction(sendBundleTxMeta.txParams, {
      type: sendBundleTxMeta.type,
      networkClientId,
      requireApproval: true,
    });

    // 4. Copy batchTransactions + aggregate gas (same as handleSmartTransaction).
    const newTxMetaWithBatch: TransactionMeta = {
      ...newTxMeta,
      batchTransactions: sendBundleTxMeta.batchTransactions,
      txParams: {
        ...newTxMeta.txParams,
        gas: sendBundleTxMeta.txParams.gas,
        maxFeePerGas: sendBundleTxMeta.txParams.maxFeePerGas,
        maxPriorityFeePerGas: sendBundleTxMeta.txParams.maxPriorityFeePerGas,
      },
    };

    // 5. Update reactive state — tracker + safety check use the new tx on
    // the next render (flushed before the `await` below resolves).
    setSendBundleTxMeta(newTxMetaWithBatch);
    setCurrentApprovalRequestId(newTxMeta.id);

    // 6. Approve → triggers device signing. Same success/error dispatch
    // pattern as `submitSendBundleTransaction`: the `TransactionSubmitted`
    // dispatch is the safety net that transitions the state machine to
    // `Submitted` (which marks all steps complete and triggers navigation
    // to the activity list). Without it, the state gets stuck at
    // `AwaitingFinalSignature` if the tracker misses the gas-tx event.
    const submissionGeneration = retryGenerationRef.current;

    try {
      await dispatch(updateAndApproveTx(newTxMetaWithBatch, true, ''));
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    } catch (error) {
      if (isStaleAttempt(submissionGeneration)) {
        return;
      }

      if (isUserRejectedHardwareWalletError(error)) {
        dispatchSignatureEvent({
          type: HardwareWalletSignatureEvent.TransactionRejected,
        });
        return;
      }

      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    }
  }, [
    currentApprovalRequestId,
    dispatch,
    dispatchSignatureEvent,
    isStaleAttempt,
    sendBundleTxMeta,
  ]);

  return {
    submitSendBundleTransaction,
    retrySendBundleSubmission,
  };
}
