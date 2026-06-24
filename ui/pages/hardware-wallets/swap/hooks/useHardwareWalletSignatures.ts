import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import log from 'loglevel';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { providerErrors } from '@metamask/rpc-errors';
import { getIsStxEnabled } from '../../../../ducks/bridge/selectors';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useBridgeNavigation } from '../../../../hooks/bridge/useBridgeNavigation';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';

import { useHwSwapQuoteData } from '../../../../hooks/hardware-wallets/useHwSwapQuoteData';
import { useHwSwapSubmission } from '../../../../hooks/hardware-wallets/useHwSwapSubmission';
import { useHwSwapConnectionMonitoring } from '../../../../hooks/hardware-wallets/useHwSwapConnectionMonitoring';
import { useHwSwapConfirmationMonitoring } from '../../../../hooks/hardware-wallets/useHwSwapConfirmationMonitoring';
import { useHwSwapQrState } from '../../../../hooks/hardware-wallets/useHwSwapQrState';
import { useHwSwapNavigation } from '../../../../hooks/hardware-wallets/useHwSwapNavigation';
import {
  ConnectionStatus,
  isUserRejectedHardwareWalletError,
  useHardwareWalletActions,
  useHardwareWalletState,
} from '../../../../contexts/hardware-wallets';
import { isHardwareWallet } from '../../../../../shared/lib/selectors/keyring';
import useSubmitBridgeTransaction from '../../../../hooks/bridge/useSubmitBridgeTransaction';
import { useHwSignTracker } from '../../../../hooks/hardware-wallets/useHwSignTracker';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  rejectPendingApproval,
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
  SignatureStepStatus,
  getStepDescriptions,
  getStepLabels,
  getQrHardwareSigningPageTitle,
  getStepStatus,
  getTitle,
  getTransactionField,
} from '../hardware-wallet-signatures.utils';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
  hardwareWalletSignaturesReducer,
} from '../hardware-wallet-signatures-state-machine';
import type { UseHardwareWalletSignaturesReturn } from './useHardwareWalletSignatures.types';

const SIGNATURE_STUCK_TIMEOUT_MS = 5_000;

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
};

type HardwareWalletSignaturesLocationState = {
  sendBundle?: SendBundleHardwareWalletState | null;
};

/**
 * Checks whether the current state machine status represents a step where the
 * user is expected to sign on their hardware device.
 *
 * @param status - The current signature state machine status.
 * @returns True when the status is AwaitingFirstSignature or AwaitingFinalSignature.
 */
function isAwaitingSignature(status: HardwareWalletSignatureStatus): boolean {
  return (
    status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  );
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const sendBundleState = (location.state as HardwareWalletSignaturesLocationState)
    ?.sendBundle;
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
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const isStxEnabled = useSelector(getIsStxEnabled);
  // Wallet-safety: capture the pending approval (if any) for the id we expect
  // to sign. `null` here means the approval is no longer pending — the submit
  // guard refuses to call `updateAndApproveTx` in that case to prevent
  // signing a stale txMeta.
  const expectedSendBundleApproval = useSelector((state) =>
    currentApprovalRequestId
      ? internalSelectPendingApproval(
          state as ApprovalsMetaMaskState,
          currentApprovalRequestId,
        )
      : undefined,
  );
  const { trackEvent } = useContext(MetaMetricsContext);
  const { navigateToBridgePage } = useBridgeNavigation();

  const { lockedQuote, fromToken, toToken, hardwareWalletType } =
    useHwSwapQuoteData();
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

  log.debug(
    '[HW-Batch] HardwareWalletSignatures render',
    JSON.stringify({
      hasLockedQuote: Boolean(lockedQuote),
      requestId: lockedQuote?.quote?.requestId ?? null,
      needsTwoConfirmations,
      hardwareWalletUsed,
      hardwareWalletType: hardwareWalletType ?? null,
    }),
  );

  const [signatureState, dispatchSignatureEvent] = useReducer(
    hardwareWalletSignaturesReducer,
    needsTwoConfirmations,
    getInitialHardwareWalletSignaturesState,
  );

  const hasTrackedPageView = useRef(false);
  const retryGenerationRef = useRef(0);
  // Guards the HW callbacks (Submitted / Rejected / Failed) so that errors
  // produced by the OLD submission during cancelCurrentBatch() don't race
  // with the retry and prematurely transition the state machine.
  const isRetryingRef = useRef(false);
  // Tracks whether the user has retried at least once. Once true, the
  // "Resend transaction" button becomes eligible after SIGNATURE_STUCK_TIMEOUT_MS.
  const hasRetriedRef = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [firstSignatureDone, setFirstSignatureDone] = useState(false);
  // Set to true when the device has been in an awaiting-signature state for
  // longer than SIGNATURE_STUCK_TIMEOUT_MS without progressing. Resets when
  // the state leaves awaiting-signature or a retry starts.
  const [hasSignatureTimedOut, setHasSignatureTimedOut] = useState(false);
  const { connectionState } = useHardwareWalletState();

  /**
   * Called when the hardware wallet transaction submission succeeds.
   * Dispatches TransactionSubmitted unless a retry is in flight.
   */
  const handleHardwareWalletSubmitted = useCallback(() => {
    if (isRetryingRef.current) {
      return;
    }
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  }, [dispatchSignatureEvent]);

  /**
   * Called when the user rejects the signature on the hardware device.
   * Dispatches TransactionRejected unless a retry is in flight.
   */
  const handleHardwareWalletRejected = useCallback(() => {
    if (isRetryingRef.current) {
      return;
    }
    log.debug(
      '[HW-Batch] handleHardwareWalletRejected, current state:',
      signatureState.status,
    );
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  }, [dispatchSignatureEvent, signatureState.status]);

  /**
   * Called when the hardware wallet signing fails due to an error.
   * Dispatches TransactionFailed unless a retry is in flight.
   */
  const handleHardwareWalletFailed = useCallback(() => {
    if (isRetryingRef.current) {
      return;
    }
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  }, [dispatchSignatureEvent]);

  const submitSendBundleTransaction = useCallback(async () => {
    if (!sendBundleTxMeta) {
      return;
    }

    // WALLET SAFETY: refuse to submit unless the pending approval captured at
    // navigation time is still pending. Prevents signing a stale txMeta after
    // back/forward navigation, multi-tab races, or other stale-nav-state
    // scenarios. Ported from mobile's `useHardwareWalletSubmit.submitSendFlow`
    // (lines 124-141).
    if (!expectedSendBundleApproval) {
      log.warn(
        '[HW-SendBundle] refusing to submit — approval no longer pending',
        {
          expectedApprovalId: currentApprovalRequestId,
        },
      );
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
      return;
    }

    try {
      await dispatch(updateAndApproveTx(sendBundleTxMeta, true, ''));
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    } catch (error) {
      if (isUserRejectedHardwareWalletError(error)) {
        dispatchSignatureEvent({
          type: HardwareWalletSignatureEvent.TransactionRejected,
        });
        return;
      }

      log.warn('[HW-Batch] sendBundle transaction submission failed', error);
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    }
  }, [
    currentApprovalRequestId,
    dispatch,
    dispatchSignatureEvent,
    expectedSendBundleApproval,
    sendBundleTxMeta,
  ]);

  const { submitBridgeTransaction } = useSubmitBridgeTransaction({
    submitOnHardwareWalletSigningPage: true,
    onHardwareWalletSubmitted: handleHardwareWalletSubmitted,
    onHardwareWalletRejected: handleHardwareWalletRejected,
    onHardwareWalletFailed: handleHardwareWalletFailed,
  });

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

    const {chainId} = sendBundleTxMeta;
    if (!chainId) {
      log.warn('[HW-SendBundle] retry: no chainId on txMeta');
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
      return;
    }

    // 1. Reject the old approval (cleanup) — may already be resolved.
    if (currentApprovalRequestId) {
      try {
        await dispatch(
          rejectPendingApproval(
            currentApprovalRequestId,
            providerErrors.userRejectedRequest().serialize(),
          ),
        );
      } catch {
        // Approval may already be resolved/rejected — safe to ignore.
      }
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
    try {
      await dispatch(updateAndApproveTx(newTxMetaWithBatch, true, ''));
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    } catch (error) {
      if (isUserRejectedHardwareWalletError(error)) {
        dispatchSignatureEvent({
          type: HardwareWalletSignatureEvent.TransactionRejected,
        });
        return;
      }

      log.warn('[HW-SendBundle] retry submission failed', error);
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    }
  }, [
    currentApprovalRequestId,
    dispatch,
    dispatchSignatureEvent,
    sendBundleTxMeta,
  ]);

  const fromAddress =
    sendBundleTxMeta?.txParams.from ??
    getTransactionField(lockedQuote?.trade, 'from');

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
    hardwareWalletUsed,
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
    hardwareWalletUsed,
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

  // WORKAROUND: Set the Trezor signing-in-progress flag to suppress
  // spurious WebUSB disconnect teardowns during signing. See
  // isSigningInProgressRef in HardwareWalletStateManager for details.
  const { setSigningInProgress } = useHardwareWalletActions();

  useEffect(() => {
    const isAwaiting = isAwaitingSignature(signatureState.status);
    const isTerminal =
      signatureState.status === HardwareWalletSignatureStatus.Submitted ||
      signatureState.status === HardwareWalletSignatureStatus.Failed ||
      signatureState.status === HardwareWalletSignatureStatus.Rejected ||
      signatureState.status === HardwareWalletSignatureStatus.Disconnected;

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
      signatureState.status === HardwareWalletSignatureStatus.AwaitingFinalSignature ||
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

  useEffect(() => {
    if (hasTrackedPageView.current || !lockedQuote) {
      return;
    }

    hasTrackedPageView.current = true;
    trackEvent({
      event: 'Awaiting Signature(s) on a HW wallet',
      category: MetaMetricsEventCategory.Swaps,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        needs_two_confirmations: needsTwoConfirmations,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_from: fromToken?.symbol ?? '',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_to: toToken?.symbol ?? '',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_hardware_wallet: hardwareWalletUsed,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hardware_wallet_type: hardwareWalletType ?? '',
      },
      sensitiveProperties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_from_amount: lockedQuote?.quote?.srcTokenAmount ?? '',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_to_amount: lockedQuote?.quote?.destTokenAmount ?? '',
      },
    });
  }, [
    fromToken?.symbol,
    hardwareWalletType,
    hardwareWalletUsed,
    lockedQuote,
    needsTwoConfirmations,
    toToken?.symbol,
    trackEvent,
  ]);

  const toAddress =
    sendBundleTxMeta?.txParams.to ??
    getTransactionField(lockedQuote?.trade, 'to');
  const spenderAddress = getTransactionField(lockedQuote?.approval, 'to');
  const firstStepStatus = getStepStatus(
    HardwareWalletSignatureStatus.AwaitingFirstSignature,
    signatureState,
  );
  const finalStepStatus = getStepStatus(
    HardwareWalletSignatureStatus.AwaitingFinalSignature,
    signatureState,
  );
  const { firstStepLabel, finalStepLabel } = getStepLabels({
    isSendBundleFlow,
    needsTwoConfirmations,
    status: signatureState.status,
    firstStepStatus,
    finalStepStatus,
    fromAmount,
    fromTokenSymbol: fromToken?.symbol,
    sendAmount: sendBundleState?.sendAmount,
    sendSymbol: sendBundleState?.sendSymbol,
    t,
  });
  const { firstStepDescription, finalStepDescription } = getStepDescriptions({
    isSendBundleFlow,
    needsTwoConfirmations,
    firstStepStatus,
    spenderAddress,
    toAddress,
    t,
  });
  const isRetryable =
    signatureState.status === HardwareWalletSignatureStatus.Rejected ||
    signatureState.status === HardwareWalletSignatureStatus.Failed ||
    signatureState.status === HardwareWalletSignatureStatus.Disconnected;
  // "Resend transaction" button: only visible after the user has retried at
  // least once (hasRetriedRef), the signature has been stuck for longer than
  // SIGNATURE_STUCK_TIMEOUT_MS, and we are still awaiting a signature.
  const showStuckRetryButton =
    hasSignatureTimedOut &&
    isAwaitingSignature(signatureState.status) &&
    !isRetrying &&
    hasRetriedRef.current;
  const showFooter =
    signatureState.status !== HardwareWalletSignatureStatus.Submitted;
  const showInlineQrCode = showInlineQrSigning && !isReadingQrSignature;
  const showQrSigningPage =
    showInlineQrSigning && activeQrStep && isReadingQrSignature;
  const qrSigningPageTitle =
    activeQrStep &&
    getQrHardwareSigningPageTitle({
      activeQrStep,
      needsTwoConfirmations,
      t,
    });
  const isFinalSignature =
    activeQrStep === HardwareWalletSignatureStatus.AwaitingFinalSignature;
  // During the inline QR display phase (the QR code is shown for the user to
  // scan with their wallet), replace the generic heading with a step-numbered
  // QR instruction such as "Step 1 of 4: Scan this QR code with your wallet".
  const qrInlineTitle =
    showInlineQrCode && activeQrStep
      ? getQrHardwareSigningPageTitle({
          activeQrStep,
          isDisplayPhase: true,
          needsTwoConfirmations,
          t,
        })
      : undefined;
  const title = qrInlineTitle ?? getTitle({
    status: signatureState.status,
    needsTwoConfirmations,
    t,
  });
  const hasSigningRequest = Boolean(lockedQuote || sendBundleTxMeta);

  const handleQrSigningPageBack = useCallback(() => {
    setIsReadingQrSignature(false);
  }, [setIsReadingQrSignature]);

  const handleOpenQrSigningPage = useCallback(() => {
    setIsReadingQrSignature(true);
  }, [setIsReadingQrSignature]);

  /**
   * Retries the hardware wallet signing flow after a rejection, failure, or
   * device disconnection. Cancels the current batch, resets the state machine,
   * and re-submits the bridge transaction.
   */
  const handleRetry = useCallback(async () => {
    if (isRetryingRef.current) {
      return;
    }

    log.debug(
      '[HW-Batch] handleRetry',
      JSON.stringify({
        state: signatureState.status,
        connection: connectionState.status,
        retryGeneration: retryGenerationRef.current,
      }),
    );

    isRetryingRef.current = true;
    hasRetriedRef.current = true;
    setIsRetrying(true);

    try {
      retryGenerationRef.current += 1;

      await cancelCurrentBatch();

      const canRetry =
        connectionState.status === ConnectionStatus.Connected ||
        connectionState.status === ConnectionStatus.Ready ||
        connectionState.status === ConnectionStatus.AwaitingConfirmation ||
        connectionState.status === ConnectionStatus.ErrorState;

      if (!canRetry) {
        log.debug('[HW-Batch] handleRetry: cannot retry, device not connected');
        return;
      }

      retryGenerationRef.current += 1;
      resetConnectionError();
      if (isStxEnabled) {
        dispatchSignatureEvent({
          type: HardwareWalletSignatureEvent.Reset,
          needsTwoConfirmations,
        });
      } else {
        let savedStep: HardwareWalletSignatureStatus | undefined;
        if ('rejectedSignature' in signatureState) {
          savedStep = signatureState.rejectedSignature;
        } else if ('failedSignature' in signatureState) {
          savedStep = signatureState.failedSignature;
        } else if ('disconnectedSignature' in signatureState) {
          savedStep = signatureState.disconnectedSignature;
        }

        if (
          savedStep === HardwareWalletSignatureStatus.AwaitingFinalSignature
        ) {
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
      log.debug(
        '[HW-Batch] handleRetry: calling retrySubmission',
        JSON.stringify({ state: signatureState.status }),
      );
      if (isSendBundleFlow) {
        hasStartedSendBundleSubmission.current = true;
        await retrySendBundleSubmission();
      } else {
        await retrySubmission();
      }
      log.debug('[HW-Batch] handleRetry: retrySubmission completed');
    } finally {
      isRetryingRef.current = false;
      setIsRetrying(false);
    }
  }, [
    cancelCurrentBatch,
    connectionState.status,
    dispatchSignatureEvent,
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
   * any active QR scan, and navigates back to the bridge page.
   */
  const handleCancel = useCallback(async () => {
    await cancelCurrentBatch();
    handleQrSignatureCancel();
    if (isSendBundleFlow) {
      navigate(sendBundleState?.returnRoute ?? DEFAULT_ROUTE);
      return;
    }
    navigateToBridgePage();
  }, [
    cancelCurrentBatch,
    handleQrSignatureCancel,
    isSendBundleFlow,
    navigate,
    navigateToBridgePage,
    sendBundleState?.returnRoute,
  ]);

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
    showQrSigningPage: Boolean(showQrSigningPage),
    qrSignRequest: qrSignRequest ?? null,
    qrSigningPageTitle: qrSigningPageTitle ?? null,
    isFinalSignature,
    handleQrSigningPageBack,
    handleCancel,
    setIsReadingQrSignature,
    handleQrScanSuccess,
  };
}
