import React, {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';

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
import { isHardwareWallet } from '../../../selectors/selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import Reader from '../../../components/app/qr-hardware-popover/qr-hardware-sign-request/reader';

import { useHwSwapQuoteData } from '../../../hooks/swap/hardware-wallets/useHwSwapQuoteData';
import { useHwSwapSubmission } from '../../../hooks/swap/hardware-wallets/useHwSwapSubmission';
import { useHwSwapConnectionMonitoring } from '../../../hooks/swap/hardware-wallets/useHwSwapConnectionMonitoring';
import { useHwSwapConfirmationMonitoring } from '../../../hooks/swap/hardware-wallets/useHwSwapConfirmationMonitoring';
import { useHwSwapQrState } from '../../../hooks/swap/hardware-wallets/useHwSwapQrState';
import { useHwSwapNavigation } from '../../../hooks/swap/hardware-wallets/useHwSwapNavigation';
import {
  ConnectionStatus,
  useHardwareWalletActions,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import SignatureStatusIcon from './signature-status-icon';
import QrSignatureCode from './qr-signature-code';
import GenericHardwareWalletAnimation from './generic-hardware-wallet-animation';
import {
  SignatureStepStatus,
  getFinalStepLabel,
  getFinalStepDescription,
  getFirstStepDescription,
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
import { useHwBatchSignTracker } from './useHwBatchSignTracker';

const SIGNATURE_STUCK_TIMEOUT_MS = 5_000;

function isAwaitingSignature(status: HardwareWalletSignatureStatus): boolean {
  return (
    status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  );
}

export default function HardwareWalletSignatures() {
  const t = useI18nContext();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const { trackEvent } = useContext(MetaMetricsContext);
  const { navigateToBridgePage } = useBridgeNavigation();

  const { lockedQuote, fromToken, toToken, hardwareWalletType } =
    useHwSwapQuoteData();
  const needsTwoConfirmations = Boolean(lockedQuote?.approval);
  const fromAmount = lockedQuote?.sentAmount?.amount;

  console.log(
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
  // Set to true when the device has been in an awaiting-signature state for
  // longer than SIGNATURE_STUCK_TIMEOUT_MS without progressing. Resets when
  // the state leaves awaiting-signature or a retry starts.
  const [hasSignatureTimedOut, setHasSignatureTimedOut] = useState(false);
  const { connectionState } = useHardwareWalletState();

  const handleHardwareWalletSubmitted = useCallback(() => {
    if (isRetryingRef.current) {
      return;
    }
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  }, [dispatchSignatureEvent]);

  const handleHardwareWalletRejected = useCallback(() => {
    if (isRetryingRef.current) {
      return;
    }
    console.log(
      '[HW-Batch] handleHardwareWalletRejected, current state:',
      signatureState.status,
    );
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  }, [dispatchSignatureEvent, signatureState.status]);

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
    retryGenerationRef,
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
  });

  useHwSwapNavigation({ signatureState });

  const { cancelCurrentBatch } = useHwBatchSignTracker(
    fromAddress,
    hardwareWalletUsed,
    needsTwoConfirmations,
    dispatchSignatureEvent,
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
  }, [signatureState.status, setSigningInProgress]);

  // Clean up on unmount (e.g. user cancels or navigates away)
  useEffect(() => {
    return () => {
      setSigningInProgress(false);
    };
  }, [setSigningInProgress]);

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
  const getQrTitle = () => {
    if (
      needsTwoConfirmations &&
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature
    ) {
      return t('bridgeHwAlmostThereTitle');
    }
    return t('swapConfirmWithHwWallet');
  };
  const displayedTitle = showInlineQrSigning ? getQrTitle() : title;

  const handleRetry = useCallback(async () => {
    if (isRetryingRef.current) {
      return;
    }

    console.log(
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
        console.log(
          '[HW-Batch] handleRetry: cannot retry, device not connected',
        );
        return;
      }

      retryGenerationRef.current += 1;
      resetConnectionError();
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.Reset,
        needsTwoConfirmations,
      });
      console.log(
        '[HW-Batch] handleRetry: calling retrySubmission',
        JSON.stringify({ state: signatureState.status }),
      );
      await retrySubmission();
      console.log('[HW-Batch] handleRetry: retrySubmission completed');
    } finally {
      isRetryingRef.current = false;
      setIsRetrying(false);
    }
  }, [
    cancelCurrentBatch,
    connectionState.status,
    dispatchSignatureEvent,
    needsTwoConfirmations,
    resetConnectionError,
    retryGenerationRef,
    retrySubmission,
    signatureState.status,
  ]);
  const handleCancel = useCallback(async () => {
    await cancelCurrentBatch();
    handleQrSignatureCancel();
    navigateToBridgePage();
  }, [cancelCurrentBatch, handleQrSignatureCancel, navigateToBridgePage]);

  return (
    <Box
      className="hardware-wallet-signatures"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      style={{ flex: 1, width: '100%', minHeight: '100%' }}
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
        >
          {displayedTitle}
        </Text>
        {lockedQuote && (
          <>
            {isReadingQrSignature && qrSignRequest && (
              <Box
                className="hardware-wallet-signatures__qr-reader"
                style={{ width: '100%' }}
                marginBottom={6}
              >
                <Reader
                  cancelQRHardwareSignRequest={handleQrSignatureCancel}
                  submitQRHardwareSignature={handleQrScanSuccess}
                  requestId={qrSignRequest.request.requestId}
                  setErrorTitle={() => undefined}
                />
              </Box>
            )}
            <ul className="hardware-wallet-signatures__steps">
              {needsTwoConfirmations && (
                <li>
                  <SignatureStatusIcon
                    status={firstStepStatus}
                    stepNumber={1}
                  />
                  <Box flexDirection={BoxFlexDirection.Column}>
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
                    {activeQrStep ===
                      HardwareWalletSignatureStatus.AwaitingFirstSignature &&
                      qrSignRequest && (
                        <QrSignatureCode
                          payload={qrSignRequest.request.payload}
                        />
                      )}
                  </Box>
                </li>
              )}
              <li>
                <SignatureStatusIcon
                  status={finalStepStatus}
                  stepNumber={needsTwoConfirmations ? 2 : 1}
                />
                <Box flexDirection={BoxFlexDirection.Column}>
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
                  {activeQrStep ===
                    HardwareWalletSignatureStatus.AwaitingFinalSignature &&
                    qrSignRequest && (
                      <QrSignatureCode
                        payload={qrSignRequest.request.payload}
                      />
                    )}
                </Box>
              </li>
            </ul>
          </>
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
            >
              {t('bridgeHwResendTransaction')}
            </Button>
          )}
          {showInlineQrSigning && !isRetryable && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={() => setIsReadingQrSignature(true)}
            >
              {t('bridgeQrHardwareScanSignature')}
            </Button>
          )}
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={handleCancel}
          >
            {t('cancel')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
