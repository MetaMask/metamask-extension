import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useAppSelector } from '../../../../store/store';

import { getIsStxEnabled } from '../../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { useHwSwapQuoteData } from '../../../../hooks/hardware-wallets/useHwSwapQuoteData';
import { useHwSwapSubmission } from '../../../../hooks/hardware-wallets/useHwSwapSubmission';
import { useHwSwapConnectionMonitoring } from '../../../../hooks/hardware-wallets/useHwSwapConnectionMonitoring';
import { useHwSwapConfirmationMonitoring } from '../../../../hooks/hardware-wallets/useHwSwapConfirmationMonitoring';
import { useHwSwapQrState } from '../../../../hooks/hardware-wallets/useHwSwapQrState';
import { useHwSwapNavigation } from '../../../../hooks/hardware-wallets/useHwSwapNavigation';
import { useHwSwapActions } from '../../../../hooks/hardware-wallets/useHwSwapActions';
import {
  isUserRejectedHardwareWalletError,
  useHardwareWalletActions,
} from '../../../../contexts/hardware-wallets';
import { isHardwareWallet } from '../../../../../shared/lib/selectors/keyring';
import useSubmitBridgeTransaction from '../../../../hooks/bridge/useSubmitBridgeTransaction';
import { useHwSignTracker } from '../../../../hooks/hardware-wallets/useHwSignTracker';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  updateAndApproveTx,
} from '../../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../../store/store';
import {
  type ApprovalsMetaMaskState,
  internalSelectPendingApproval,
} from '../../../../selectors';
import type { SignatureStepListProps } from '../components/signature-step-list.types';
import type { SignatureFooterProps } from '../components/signature-footer.types';
import {
  getTransactionField,
  cleanupPendingApproval,
  getHardwareWalletSignatureViewModel,
  isAwaitingSignature,
} from '../hardware-wallet-signatures.utils';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
  hardwareWalletSignaturesReducer,
} from '../hardware-wallet-signatures-state-machine';
import type { UseHardwareWalletSignaturesReturn } from './useHardwareWalletSignatures.types';

const SIGNATURE_STUCK_TIMEOUT_MS = 15_000;

type SendBundleHardwareWalletState = {
  txMeta: TransactionMeta;
  needsTwoConfirmations: boolean;
  returnRoute?: string;
  /**
   * Pending approval id captured at navigation time. The signing page refuses
   * to submit unless this id is still in `state.metamask.pendingApprovals`.
   */
  approvalRequestId: string;
  /**
   * The display amount being sent (e.g. "1.5"), used to label the send step.
   * Derived in the confirmations flow from the same source the send screen
   * uses.
   */
  sendAmount?: string;
  /**
   * The symbol of the token being sent (e.g. "ETH" or "USDC").
   */
  sendSymbol?: string;
  /**
   * The symbol of the token used to pay the network fee (always the chain's
   * native currency). Distinct from `sendSymbol` for ERC20 sends.
   */
  gasSymbol?: string;
};

type HardwareWalletSignaturesLocationState = {
  sendBundle?: SendBundleHardwareWalletState | null;
};

/**
 * Terminal signature state machine statuses — the flow has finished (either
 * successfully or due to an error) and no further signing is expected.
 */
const TERMINAL_STATUSES = new Set<HardwareWalletSignatureStatus>([
  HardwareWalletSignatureStatus.Submitted,
  HardwareWalletSignatureStatus.Failed,
  HardwareWalletSignatureStatus.Rejected,
  HardwareWalletSignatureStatus.Disconnected,
]);

/**
 * Orchestrator hook for the hardware-wallet signing-progress screen.
 *
 * Owns the entire lifecycle: reducer state, refs, effects, handlers, derived
 * display values, and the wallet-safety guard for sendBundle submissions.
 * Returns a single flat object consumed by the presentational shell
 * (`hardware-wallet-signatures.tsx`).
 *
 * The hook preserves the exact call order and dependency lists of the
 * original component body — refactoring is purely structural.
 */
export function useHardwareWalletSignatures(): UseHardwareWalletSignaturesReturn {
  const t = useI18nContext();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const location = useLocation();
  const sendBundleState = (
    location.state as HardwareWalletSignaturesLocationState
  )?.sendBundle;
  // `sendBundleTxMeta` is reactive: retry replaces it with a fresh
  // TransactionMeta (created via `addTransaction`). All consumers — the
  // tracker's expectedTxIds, the safety check, the auto-submit effect —
  // automatically pick up the new value on the next render.
  const [sendBundleTxMeta, setSendBundleTxMeta] = useState(
    sendBundleState?.txMeta,
  );
  const isSendBundleFlow = Boolean(sendBundleTxMeta);
  // Reactive approval id: updated on retry so the wallet-safety selector
  // tracks the CURRENT pending approval, not the original one.
  const [currentApprovalRequestId, setCurrentApprovalRequestId] = useState(
    sendBundleState?.approvalRequestId,
  );
  const isHardwareWalletAccount = useSelector(isHardwareWallet);
  const isStxEnabled = useSelector(getIsStxEnabled);
  // Wallet-safety: capture the pending approval (if any) for the id we expect
  // to sign. `null` here means the approval is no longer pending — the submit
  // guard refuses to call `updateAndApproveTx` in that case to prevent
  // signing a stale txMeta.
  const expectedSendBundleApproval = useAppSelector((state) =>
    currentApprovalRequestId
      ? internalSelectPendingApproval(state, currentApprovalRequestId)
      : undefined,
  );

  const { lockedQuote, fromToken, toToken } = useHwSwapQuoteData();
  const needsTwoConfirmations = isSendBundleFlow
    ? Boolean(sendBundleState?.needsTwoConfirmations)
    : Boolean(lockedQuote?.approval);
  const fromAmount = lockedQuote?.sentAmount?.amount;
  const activeSigningRequestId =
    lockedQuote?.quote.requestId ?? sendBundleTxMeta?.id ?? '';
  const expectedSignTrackerTxIds = useMemo(() => {
    if (!sendBundleTxMeta) {
      return undefined;
    }

    const nestedTransactionIds =
      sendBundleTxMeta.batchTransactions
        ?.map((batchTransaction) =>
          'id' in batchTransaction && typeof batchTransaction.id === 'string'
            ? batchTransaction.id
            : undefined,
        )
        .filter((txId): txId is string => Boolean(txId)) ?? [];

    return [sendBundleTxMeta.id, ...nestedTransactionIds];
  }, [sendBundleTxMeta]);
  const expectedSignTrackerTransactionParams = useMemo(
    () =>
      sendBundleTxMeta?.batchTransactions?.map((batchTransaction) => ({
        data: batchTransaction.data,
        to: batchTransaction.to,
        value: batchTransaction.value,
      })),
    [sendBundleTxMeta?.batchTransactions],
  );

  const [signatureState, dispatchSignatureEvent] = useReducer(
    hardwareWalletSignaturesReducer,
    needsTwoConfirmations,
    getInitialHardwareWalletSignaturesState,
  );

  const retryGenerationRef = useRef(0);
  // Guards HW reject/fail dispatches so errors from the OLD submission during
  // cancelCurrentBatch() don't race with the retry and prematurely transition
  // the state machine. Cleared before the new resubmit so that attempt's
  // reject/fail still update state. Owned here (not in useHwSwapActions) so
  // submitBridgeTransaction — defined earlier in the hook order — can read it.
  //
  // Generation checks in the catch handlers cover the remaining race: a late
  // reject that settles after cancel finishes and after this flag is cleared,
  // while the new attempt is still starting. `retryGenerationRef` is bumped
  // before resubmit, so those stale catches see a mismatched generation.
  const isRetryingRef = useRef(false);
  const [firstSignatureDone, setFirstSignatureDone] = useState(false);
  // Set to true when the device has been in an awaiting-signature state for
  // longer than SIGNATURE_STUCK_TIMEOUT_MS without progressing. Resets when
  // the state leaves awaiting-signature or a retry starts.
  const [hasSignatureTimedOut, setHasSignatureTimedOut] = useState(false);

  /**
   * True when a catch must not update the signature state machine: either
   * cancel-during-retry is in flight (`isRetryingRef`), or retry advanced
   * `retryGenerationRef` after this submission started (stale generation).
   */
  const isStaleAttempt = useCallback(
    (submissionGeneration: number): boolean => {
      return (
        isRetryingRef.current ||
        submissionGeneration !== retryGenerationRef.current
      );
    },
    [],
  );

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

  const { submitBridgeTransaction: submitBridgeTransactionBase } =
    useSubmitBridgeTransaction();

  /**
   * Wraps bridge submission so hardware-wallet reject/fail outcomes update the
   * signature state machine. `useSubmitBridgeTransaction` throws on those
   * outcomes; we translate them here unless the attempt is stale (cancel-
   * during-retry in flight, or retry advanced `retryGenerationRef` after this
   * submission started).
   */
  const submitBridgeTransaction = useCallback(
    async (quoteResponse: QuoteResponse & QuoteMetadata) => {
      const submissionGeneration = retryGenerationRef.current;

      try {
        await submitBridgeTransactionBase(quoteResponse);
      } catch (error) {
        if (!isStaleAttempt(submissionGeneration)) {
          if (isUserRejectedHardwareWalletError(error)) {
            dispatchSignatureEvent({
              type: HardwareWalletSignatureEvent.TransactionRejected,
            });
          } else {
            dispatchSignatureEvent({
              type: HardwareWalletSignatureEvent.TransactionFailed,
            });
          }
        }
        throw error;
      }
    },
    [
      dispatchSignatureEvent,
      isStaleAttempt,
      signatureState.status,
      submitBridgeTransactionBase,
    ],
  );

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
    setCurrentApprovalRequestId(String(newTxMeta.id));

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

  const getPrimaryTxField = (field: 'from' | 'to'): string | undefined =>
    sendBundleTxMeta?.txParams[field] ??
    getTransactionField(lockedQuote?.trade, field);
  const fromAddress = getPrimaryTxField('from');

  const { retrySubmission, hasStartedSubmission } = useHwSwapSubmission({
    lockedQuote,
    needsTwoConfirmations,
    signatureState,
    dispatchSignatureEvent,
    submitBridgeTransaction,
    firstSignatureDone: isStxEnabled ? undefined : firstSignatureDone,
    onResetFirstSignature: isStxEnabled
      ? undefined
      : () => setFirstSignatureDone(false),
  });
  const hasStartedSendBundleSubmission = useRef(false);
  const hasStartedHardwareWalletSubmission = isSendBundleFlow
    ? hasStartedSendBundleSubmission
    : hasStartedSubmission;

  useEffect(() => {
    if (
      !isSendBundleFlow ||
      !sendBundleTxMeta ||
      hasStartedSendBundleSubmission.current
    ) {
      return;
    }

    hasStartedSendBundleSubmission.current = true;
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });

    submitSendBundleTransaction().catch(() => {
      hasStartedSendBundleSubmission.current = false;
    });
  }, [
    dispatchSignatureEvent,
    isSendBundleFlow,
    needsTwoConfirmations,
    sendBundleTxMeta,
    submitSendBundleTransaction,
  ]);

  const { isDeviceDisconnectedRef, resetConnectionError } =
    useHwSwapConnectionMonitoring({
      signatureState,
      dispatchSignatureEvent,
    });

  const { confirmationTxData } = useHwSwapConfirmationMonitoring({
    hardwareWalletUsed: isHardwareWalletAccount,
    signatureState,
    dispatchSignatureEvent,
    retryGenerationCounterRef: retryGenerationRef,
    isDeviceDisconnectedRef,
  });

  const {
    isReadingQrSignature,
    setIsReadingQrSignature,
    qrSignRequest,
    showInlineQrSigning,
    activeQrStep,
    handleQrScanSuccess,
    handleQrSignatureCancel,
  } = useHwSwapQrState({
    signatureState,
    confirmationTxData,
    stepTrackingResetKey: `${activeSigningRequestId}:${retryGenerationRef.current}`,
  });

  useHwSwapNavigation({ signatureState });

  const { cancelCurrentBatch } = useHwSignTracker(
    fromAddress,
    isHardwareWalletAccount,
    dispatchSignatureEvent,
    {
      enabled: true,
      expectedTransactionParams: expectedSignTrackerTransactionParams,
      expectedTxIds: expectedSignTrackerTxIds,
      includeSendBundleTransactions: isSendBundleFlow,
      useBatchTracking: isStxEnabled,
    },
    retryGenerationRef,
  );

  const { handleRetry, handleCancel, isRetrying, hasRetriedRef } =
    useHwSwapActions({
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
      returnRoute: sendBundleState?.returnRoute,
      isRetryingRef,
    });

  // WORKAROUND: Set the Trezor signing-in-progress flag to suppress
  // spurious WebUSB disconnect teardowns during signing. See
  // isSigningInProgressRef in HardwareWalletStateManager for details.
  const { setSigningInProgress } = useHardwareWalletActions();

  useEffect(() => {
    const isAwaiting = isAwaitingSignature(signatureState.status);
    const isTerminal = TERMINAL_STATUSES.has(signatureState.status);

    if (hasStartedHardwareWalletSubmission.current && isAwaiting) {
      setSigningInProgress(true);
    } else if (isTerminal) {
      setSigningInProgress(false);
    }
  }, [
    signatureState.status,
    setSigningInProgress,
    hasStartedHardwareWalletSubmission,
  ]);

  // Clean up on unmount (e.g. user cancels or navigates away)
  useEffect(() => {
    return () => {
      setSigningInProgress(false);
    };
  }, [setSigningInProgress]);

  useEffect(() => {
    if (
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature ||
      signatureState.status === HardwareWalletSignatureStatus.Submitted
    ) {
      setFirstSignatureDone(true);
    }
  }, [signatureState.status]);

  useEffect(() => {
    if (!isAwaitingSignature(signatureState.status)) {
      setHasSignatureTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setHasSignatureTimedOut(true);
    }, SIGNATURE_STUCK_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [signatureState.status]);

  // Resets the stuck-timeout flag while a retry is in flight so the
  // "Resend transaction" button disappears and the timer effectively
  // restarts from zero once the state machine re-enters awaiting-signature.
  useEffect(() => {
    if (isRetrying) {
      setHasSignatureTimedOut(false);
    }
  }, [isRetrying]);

  const {
    firstStepStatus,
    finalStepStatus,
    firstStepLabel,
    finalStepLabel,
    firstStepDescription,
    finalStepDescription,
    isRetryable,
    showStuckRetryButton,
    showFooter,
    showInlineQrCode,
    showQrSigningPage,
    qrSigningPageTitle,
    isFinalSignature,
    title,
    hasSigningRequest,
  } = getHardwareWalletSignatureViewModel({
    signatureState,
    isSendBundleFlow,
    needsTwoConfirmations,
    toAddress: getPrimaryTxField('to'),
    spenderAddress: getTransactionField(lockedQuote?.approval, 'to'),
    fromAmount,
    fromTokenSymbol: fromToken?.symbol,
    sendAmount: sendBundleState?.sendAmount,
    sendSymbol: sendBundleState?.sendSymbol,
    gasSymbol: sendBundleState?.gasSymbol,
    hasSigningRequest: Boolean(lockedQuote || sendBundleTxMeta),
    hasSignatureTimedOut,
    isRetrying,
    hasRetried: hasRetriedRef.current,
    showInlineQrSigning,
    isReadingQrSignature,
    activeQrStep,
    t,
  });

  const handleQrSigningPageBack = useCallback(() => {
    setIsReadingQrSignature(false);
  }, [setIsReadingQrSignature]);

  const handleOpenQrSigningPage = useCallback(() => {
    setIsReadingQrSignature(true);
  }, [setIsReadingQrSignature]);

  const stepList: SignatureStepListProps = {
    hasSigningRequest,
    needsTwoConfirmations,
    firstStepStatus,
    firstStepLabel,
    firstStepDescription,
    finalStepStatus,
    finalStepLabel,
    finalStepDescription,
    showInlineQrCode,
    activeQrStep: activeQrStep ?? null,
    qrSignRequest: qrSignRequest ?? null,
  };

  const footer: SignatureFooterProps = {
    isRetryable,
    isRetrying,
    showStuckRetryButton,
    showInlineQrCode,
    isFinalSignature,
    status: signatureState.status,
    handleRetry,
    handleCancel,
    handleOpenQrSigningPage,
  };

  return {
    signatureStatus: signatureState.status,
    title,
    stepList,
    showFooter,
    footer,
    showQrSigningPage,
    qrSignRequest: qrSignRequest ?? null,
    qrSigningPageTitle,
    isFinalSignature,
    handleQrSigningPageBack,
    handleCancel,
    setIsReadingQrSignature,
    handleQrScanSuccess,
  };
}
