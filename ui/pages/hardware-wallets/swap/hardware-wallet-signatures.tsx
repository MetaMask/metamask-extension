import React, {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getIsStxEnabled } from '../../../ducks/bridge/selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';

import { useHwSwapQuoteData } from '../../../hooks/hardware-wallets/useHwSwapQuoteData';
import { useHwSwapSubmission } from '../../../hooks/hardware-wallets/useHwSwapSubmission';
import { useHwSwapConnectionMonitoring } from '../../../hooks/hardware-wallets/useHwSwapConnectionMonitoring';
import { useHwSwapConfirmationMonitoring } from '../../../hooks/hardware-wallets/useHwSwapConfirmationMonitoring';
import { useHwSwapQrState } from '../../../hooks/hardware-wallets/useHwSwapQrState';
import { useHwSwapNavigation } from '../../../hooks/hardware-wallets/useHwSwapNavigation';
import {
  ConnectionStatus,
  useHardwareWalletActions,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import { isHardwareWallet } from '../../../../shared/lib/selectors/keyring';
import useSubmitBridgeTransaction from '../../../hooks/bridge/useSubmitBridgeTransaction';
import { useHwSignTracker } from '../../../hooks/hardware-wallets/useHwSignTracker';
import SignatureStatusIcon from './signature-status-icon';
import GenericHardwareWalletAnimation from './generic-hardware-wallet-animation';
import QrHardwareSigningPage, {
  QrHardwareSigningPhase,
} from './qr-hardware-signing-page';
import QrSignatureCode from './qr-signature-code';
import {
  SignatureStepStatus,
  getFinalStepLabel,
  getFinalStepDescription,
  getFirstStepDescription,
  getQrHardwareSigningPageTitle,
  getStepStatus,
  getTitle,
  getTransactionField,
} from './hardware-wallet-signatures.utils';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
  hardwareWalletSignaturesReducer,
} from './hardware-wallet-signatures-state-machine';

const SIGNATURE_STUCK_TIMEOUT_MS = 5_000;

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
 * Signing page for hardware wallet bridge/swap transactions. Manages the
 * full lifecycle: quote display, device connection monitoring, signature
 * progress tracking (approval + trade), QR code signing, retry on failure
 * or disconnection, and post-submission navigation.
 */
export default function HardwareWalletSignatures() {
  const t = useI18nContext();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const isStxEnabled = useSelector(getIsStxEnabled);
  const { trackEvent } = useContext(MetaMetricsContext);
  const { navigateToBridgePage } = useBridgeNavigation();

  const { lockedQuote, fromToken, toToken, hardwareWalletType } =
    useHwSwapQuoteData();
  const needsTwoConfirmations = Boolean(lockedQuote?.approval);
  const fromAmount = lockedQuote?.sentAmount?.amount;

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
  const firstSignatureDoneRef = useRef(false);
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

  const { submitBridgeTransaction } = useSubmitBridgeTransaction({
    submitOnHardwareWalletSigningPage: true,
    onHardwareWalletSubmitted: handleHardwareWalletSubmitted,
    onHardwareWalletRejected: handleHardwareWalletRejected,
    onHardwareWalletFailed: handleHardwareWalletFailed,
  });

  const fromAddress = getTransactionField(lockedQuote?.trade, 'from');

  const { retrySubmission, hasStartedSubmission } = useHwSwapSubmission({
    lockedQuote,
    needsTwoConfirmations,
    signatureState,
    dispatchSignatureEvent,
    submitBridgeTransaction,
    firstSignatureDoneRef: isStxEnabled ? undefined : firstSignatureDoneRef,
  });

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
    stepTrackingResetKey: `${lockedQuote?.quote.requestId ?? ''}:${
      retryGenerationRef.current
    }`,
  });

  useHwSwapNavigation({ signatureState });

  const { cancelCurrentBatch } = useHwSignTracker(
    fromAddress,
    hardwareWalletUsed,
    dispatchSignatureEvent,
    { enabled: true, useBatchTracking: isStxEnabled },
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

    if (hasStartedSubmission.current && isAwaiting) {
      setSigningInProgress(true);
    } else if (isTerminal) {
      setSigningInProgress(false);
    }
  }, [signatureState.status, setSigningInProgress, hasStartedSubmission]);

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
      firstSignatureDoneRef.current = true;
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

  const toAddress = getTransactionField(lockedQuote?.trade, 'to');
  const spenderAddress = getTransactionField(lockedQuote?.approval, 'to');
  const firstStepStatus = getStepStatus(
    HardwareWalletSignatureStatus.AwaitingFirstSignature,
    signatureState,
  );
  const finalStepStatus = getStepStatus(
    HardwareWalletSignatureStatus.AwaitingFinalSignature,
    signatureState,
  );
  const firstStepLabel =
    signatureState.status === HardwareWalletSignatureStatus.Submitted ||
    firstStepStatus === SignatureStepStatus.Complete
      ? t('bridgeHwApprovedAmount', [fromAmount, fromToken?.symbol])
      : t('bridgeHwApproveAmount', [fromAmount, fromToken?.symbol]);
  const finalStepLabel = getFinalStepLabel({
    status: signatureState.status,
    finalStepStatus,
    fromAmount,
    fromTokenSymbol: fromToken?.symbol,
    t,
  });
  const firstStepDescription = getFirstStepDescription({
    firstStepStatus,
    spenderAddress,
    t,
  });
  const finalStepDescription = getFinalStepDescription({
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
  const title = getTitle({
    status: signatureState.status,
    needsTwoConfirmations,
    t,
  });
  const displayedTitle = title;
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
      await retrySubmission();
      log.debug('[HW-Batch] handleRetry: retrySubmission completed');
    } finally {
      isRetryingRef.current = false;
      setIsRetrying(false);
    }
  }, [
    cancelCurrentBatch,
    connectionState.status,
    dispatchSignatureEvent,
    isStxEnabled,
    needsTwoConfirmations,
    resetConnectionError,
    retryGenerationRef,
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
    navigateToBridgePage();
  }, [cancelCurrentBatch, handleQrSignatureCancel, navigateToBridgePage]);

  if (showQrSigningPage && qrSignRequest && qrSigningPageTitle) {
    return (
      <QrHardwareSigningPage
        title={qrSigningPageTitle}
        phase={QrHardwareSigningPhase.ScanSignature}
        payload={qrSignRequest.request.payload}
        requestId={qrSignRequest.request.requestId}
        onBack={handleQrSigningPageBack}
        onCancel={handleCancel}
        onContinueToScan={() => setIsReadingQrSignature(true)}
        onScanSuccess={handleQrScanSuccess}
      />
    );
  }

  return (
    <Box
      className="hardware-wallet-signatures"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      style={{ flex: 1, width: '100%', minHeight: '100%' }}
      data-testid="hardware-wallet-signatures"
    >
      <Box
        className="hardware-wallet-signatures__content"
        flexDirection={BoxFlexDirection.Column}
        paddingTop={6}
        alignItems={BoxAlignItems.Start}
        style={{ height: '100%' }}
      >
        <Box
          className="hardware-wallet-signatures__device"
          marginBottom={6}
          style={{ alignSelf: 'center' }}
        >
          <GenericHardwareWalletAnimation status={signatureState.status} />
        </Box>
        <Text
          className="hardware-wallet-signatures__title"
          color={TextColor.TextDefault}
          variant={TextVariant.HeadingLg}
          data-testid="hardware-wallet-signatures__title"
        >
          {displayedTitle}
        </Text>
        {lockedQuote && (
          <ul
            className="hardware-wallet-signatures__steps"
            data-testid="hardware-wallet-signatures__steps"
          >
            {needsTwoConfirmations && (
              <li>
                <SignatureStatusIcon
                  status={firstStepStatus}
                  stepNumber={1}
                />
                <Box
                  className="min-w-0 flex-1"
                  flexDirection={BoxFlexDirection.Column}
                >
                  <Text
                    color={
                      firstStepStatus === SignatureStepStatus.Rejected ||
                      firstStepStatus === SignatureStepStatus.Failed ||
                      firstStepStatus === SignatureStepStatus.Disconnected
                        ? TextColor.ErrorDefault
                        : TextColor.TextDefault
                    }
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    {firstStepLabel}
                  </Text>
                  {firstStepDescription && (
                    <Text
                      color={TextColor.TextAlternative}
                      variant={TextVariant.BodyMd}
                    >
                      {firstStepDescription}
                    </Text>
                  )}
                  {showInlineQrCode &&
                    activeQrStep ===
                      HardwareWalletSignatureStatus.AwaitingFirstSignature &&
                    qrSignRequest && (
                      <Box
                        className="hardware-wallet-signatures__qr-code"
                        flexDirection={BoxFlexDirection.Column}
                        alignItems={BoxAlignItems.Center}
                        gap={4}
                        marginTop={4}
                      >
                        <QrSignatureCode
                          key={qrSignRequest.request.requestId}
                          payload={qrSignRequest.request.payload}
                        />
                      </Box>
                    )}
                </Box>
              </li>
            )}
            <li>
              <SignatureStatusIcon
                status={finalStepStatus}
                stepNumber={needsTwoConfirmations ? 2 : 1}
              />
              <Box
                className="min-w-0 flex-1"
                flexDirection={BoxFlexDirection.Column}
              >
                <Text
                  color={
                    finalStepStatus === SignatureStepStatus.Rejected ||
                    finalStepStatus === SignatureStepStatus.Failed ||
                    finalStepStatus === SignatureStepStatus.Disconnected
                      ? TextColor.ErrorDefault
                      : TextColor.TextDefault
                  }
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {finalStepLabel}
                </Text>
                {finalStepDescription && (
                  <Text
                    color={TextColor.TextAlternative}
                    variant={TextVariant.BodyMd}
                  >
                    {finalStepDescription}
                  </Text>
                )}
                {showInlineQrCode &&
                  activeQrStep ===
                    HardwareWalletSignatureStatus.AwaitingFinalSignature &&
                  qrSignRequest && (
                    <Box
                      className="hardware-wallet-signatures__qr-code"
                      flexDirection={BoxFlexDirection.Column}
                      alignItems={BoxAlignItems.Center}
                      gap={4}
                      marginTop={4}
                    >
                      <QrSignatureCode
                        key={qrSignRequest.request.requestId}
                        payload={qrSignRequest.request.payload}
                      />
                    </Box>
                  )}
              </Box>
            </li>
          </ul>
        )}
      </Box>
      {showFooter && (
        <Box
          className="hardware-wallet-signatures__footer"
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          style={{ width: '100%', marginTop: 'auto' }}
          padding={4}
        >
          {isRetryable && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              isDisabled={isRetrying}
              onClick={handleRetry}
              data-testid="hardware-wallet-signatures__retry-button"
            >
              {signatureState.status ===
              HardwareWalletSignatureStatus.Disconnected
                ? t('hardwareWalletErrorReconnectButton')
                : t('errorPageTryAgain')}
            </Button>
          )}
          {showStuckRetryButton && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleRetry}
              data-testid="hardware-wallet-signatures__resend-button"
            >
              {t('bridgeHwResendTransaction')}
            </Button>
          )}
          {showInlineQrCode && !isRetryable && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleOpenQrSigningPage}
              data-testid="hardware-wallet-signatures__scan-button"
            >
              {t('bridgeQrHardwareScanSignature')}
            </Button>
          )}
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={handleCancel}
            data-testid="hardware-wallet-signatures__cancel-button"
          >
            {t('cancel')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
