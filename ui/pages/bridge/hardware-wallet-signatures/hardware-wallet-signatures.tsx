import React, {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { providerErrors, serializeError } from '@metamask/rpc-errors';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import Reader from '../../../components/app/qr-hardware-popover/qr-hardware-sign-request/reader';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  ConnectionStatus,
  ErrorCode,
  getHardwareWalletErrorCode,
  isUserRejectedHardwareWalletError,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import {
  getBridgeQuotes,
  getFromToken,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import {
  cancelQrCodeScan,
  cancelTx,
  completeQrCodeScan,
  rejectPendingApproval,
} from '../../../store/actions';
import { showSuccessToast } from '../../../app/toast-listener/shared';

import { type MetaMaskReduxDispatch } from '../../../store/store';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import { useHwBatchSignTracker } from './useHwBatchSignTracker';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
  hardwareWalletSignaturesReducer,
} from './hardware-wallet-signatures-state-machine';
import {
  SignatureStepStatus,
  getFinalStepLabel,
  getFinalStepDescription,
  getFirstStepDescription,
  getStepStatus,
  getTitle,
  getTransactionField,
  isQrHardwareSignRequest,
} from './hardware-wallet-signatures.utils';
import GenericHardwareWalletAnimation from './generic-hardware-wallet-animation';
import QrSignatureCode from './qr-signature-code';
import SignatureStatusIcon from './signature-status-icon';
import type { BridgeStatusState } from './types';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function HardwareWalletSignatures() {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const fromToken = useSelector(getFromToken, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const { connectionState } = useHardwareWalletState();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  // The background's debounced `sendUpdate` can clear the quotes list when an
  // in-flight quote response races with `stopPollingForQuotes`, making
  // `activeQuote` null. Once the signing flow starts we latch the quote data
  // so the step UI survives these transient Redux state changes.
  const lockedQuoteRef = useRef(activeQuote);
  if (activeQuote && !lockedQuoteRef.current) {
    lockedQuoteRef.current = activeQuote;
  }
  const lockedQuote = lockedQuoteRef.current;
  const needsTwoConfirmations = Boolean(lockedQuote?.approval);
  const fromAmount = lockedQuote?.sentAmount?.amount;
  const { trackEvent } = useContext(MetaMetricsContext);
  const { navigateToBridgePage, navigateToDefaultRoute } =
    useBridgeNavigation();
  const [signatureState, dispatchSignatureEvent] = useReducer(
    hardwareWalletSignaturesReducer,
    needsTwoConfirmations,
    getInitialHardwareWalletSignaturesState,
  );
  const hasStartedSubmission = useRef(false);
  const hasTrackedPageView = useRef(false);
  const quoteRequestIdRef = useRef<string | undefined>();
  const handledConnectionErrorRef = useRef<unknown>(null);
  const isDeviceDisconnectedRef = useRef(false);
  const hasNavigatedAfterSubmission = useRef(false);
  const [isReadingQrSignature, setIsReadingQrSignature] = useState(false);
  const isQrHardwareWallet =
    hardwareWalletType === HardwareKeyringType.qr ||
    isQrHardwareSignRequest(activeQrCodeScanRequest);
  const qrSignRequest =
    isQrHardwareWallet && isQrHardwareSignRequest(activeQrCodeScanRequest)
      ? activeQrCodeScanRequest
      : undefined;
  const currentQrRequestId = qrSignRequest?.request.requestId;
  const confirmationTxData = useSelector(
    (state: BridgeStatusState) => state.confirmTransaction?.txData,
  );

  const previousTxIdRef = useRef<string | undefined>();
  useEffect(() => {
    const currentId = confirmationTxData?.id;
    const previousId = previousTxIdRef.current;

    console.log(
      '[HW-Batch] confirmationTxData effect',
      JSON.stringify({
        currentId: currentId ?? null,
        previousId: previousId ?? null,
        hardwareWalletUsed,
        needsTwoConfirmations,
        signatureState: signatureState.status,
      }),
    );

    if (
      hardwareWalletUsed &&
      (signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFirstSignature ||
        signatureState.status ===
          HardwareWalletSignatureStatus.AwaitingFinalSignature) &&
      previousId &&
      !currentId
    ) {
      console.log(
        '[HW-Batch] confirmationTxData cleared while signing → TransactionRejected',
        { previousId },
      );
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    }

    previousTxIdRef.current = currentId;
  }, [hardwareWalletUsed, confirmationTxData?.id, signatureState.status]);
  // `onHardwareWalletSubmitted` from `useSubmitBridgeTransaction` fires once,
  // after BOTH the approval (when needed) and the trade have been signed and
  // submitted, so we can transition straight to Submitted here. The mid-flow
  // AwaitingFirstSignature -> AwaitingFinalSignature transition is driven by
  // the `BridgeStatusController:stateChange` subscription effect below.
  const handleHardwareWalletSubmitted = useCallback(() => {
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  }, []);
  const handleHardwareWalletRejected = useCallback(() => {
    console.log(
      '[HW-Batch] handleHardwareWalletRejected, current state:',
      signatureState.status,
    );
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  }, [dispatchSignatureEvent, signatureState.status]);
  const handleHardwareWalletFailed = useCallback(() => {
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  }, []);
  const { submitBridgeTransaction } = useSubmitBridgeTransaction({
    submitOnHardwareWalletSigningPage: true,
    onHardwareWalletSubmitted: handleHardwareWalletSubmitted,
    onHardwareWalletRejected: handleHardwareWalletRejected,
    onHardwareWalletFailed: handleHardwareWalletFailed,
  });
  const submitActiveQuote = useCallback(async () => {
    if (!lockedQuote) {
      return;
    }

    await submitBridgeTransaction(lockedQuote);
  }, [lockedQuote, submitBridgeTransaction]);

  useEffect(() => {
    setIsReadingQrSignature(false);
  }, [currentQrRequestId]);

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
    hardwareWalletUsed,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    needsTwoConfirmations,
    confirmationTxData?.id,
    signatureState.status,
  ]);

  useEffect(() => {
    const requestId = lockedQuote?.quote.requestId;

    if (!requestId || quoteRequestIdRef.current === requestId) {
      return;
    }

    quoteRequestIdRef.current = requestId;
    hasStartedSubmission.current = false;
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });
  }, [lockedQuote?.quote.requestId, needsTwoConfirmations]);

  useEffect(() => {
    if (hasStartedSubmission.current || !lockedQuote) {
      return;
    }

    hasStartedSubmission.current = true;
    submitActiveQuote().catch(() => {
      hasStartedSubmission.current = false;
    });
  }, [lockedQuote, submitActiveQuote]);

  const fromAddress = getTransactionField(lockedQuote?.trade, 'from');

  useHwBatchSignTracker(
    fromAddress,
    hardwareWalletUsed,
    needsTwoConfirmations,
    dispatchSignatureEvent,
    isDeviceDisconnectedRef,
  );

  useEffect(() => {
    if (
      signatureState.status !== HardwareWalletSignatureStatus.Submitted ||
      hasNavigatedAfterSubmission.current
    ) {
      return;
    }

    hasNavigatedAfterSubmission.current = true;

    const toastId = `bridge-hw-submitted-${Date.now()}`;
    const timer = setTimeout(async () => {
      showSuccessToast(toastId);
      await navigateToDefaultRoute();
    }, 1000);

    return () => clearTimeout(timer);
  }, [signatureState.status, navigateToDefaultRoute]);

  useEffect(() => {
    const connectionError =
      connectionState.status === ConnectionStatus.ErrorState
        ? String(connectionState.error)
        : undefined;
    console.log(
      '[HW-Batch] connectionState changed',
      JSON.stringify({
        status: connectionState.status,
        error: connectionError,
      }),
      'signatureState:',
      signatureState.status,
    );

    if (
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFirstSignature &&
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFinalSignature
    ) {
      return;
    }

    if (connectionState.status === ConnectionStatus.Disconnected) {
      if (handledConnectionErrorRef.current === 'disconnected') {
        return;
      }
      handledConnectionErrorRef.current = 'disconnected';
      isDeviceDisconnectedRef.current = true;
      console.log(
        '[HW-Batch] device disconnected (status) → DeviceDisconnected',
      );
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.DeviceDisconnected,
      });
      return;
    }

    if (connectionState.status !== ConnectionStatus.ErrorState) {
      handledConnectionErrorRef.current = null;
      return;
    }

    if (handledConnectionErrorRef.current === connectionState.error) {
      return;
    }

    handledConnectionErrorRef.current = connectionState.error;

    const errorCode = getHardwareWalletErrorCode(connectionState.error);
    console.log(
      '[HW-Batch] connection error',
      JSON.stringify({
        errorCode,
        errorMessage:
          connectionState.error instanceof Error
            ? connectionState.error.message
            : String(connectionState.error),
        connectionStatus: connectionState.status,
      }),
    );

    if (
      errorCode === ErrorCode.ConnectionClosed ||
      errorCode === ErrorCode.DeviceDisconnected
    ) {
      isDeviceDisconnectedRef.current = true;
      console.log(
        '[HW-Batch] device disconnected (error) → DeviceDisconnected',
      );
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.DeviceDisconnected,
      });
      return;
    }

    dispatchSignatureEvent({
      type: isUserRejectedHardwareWalletError(connectionState.error)
        ? HardwareWalletSignatureEvent.TransactionRejected
        : HardwareWalletSignatureEvent.TransactionFailed,
    });
    console.log(
      '[HW-Batch] connection error result',
      isUserRejectedHardwareWalletError(connectionState.error)
        ? 'TransactionRejected'
        : 'TransactionFailed',
    );
  }, [connectionState, signatureState.status]);

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
  const showFooter =
    signatureState.status !== HardwareWalletSignatureStatus.Submitted;
  const title = getTitle({
    status: signatureState.status,
    needsTwoConfirmations,
    t,
  });
  const showInlineQrSigning =
    Boolean(qrSignRequest) &&
    (signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature ||
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature);
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
  const activeQrStep =
    showInlineQrSigning && !isReadingQrSignature
      ? signatureState.status
      : undefined;
  const handleQrScanSuccess = useCallback(
    (response: SerializedUR) => dispatch(completeQrCodeScan(response)),
    [dispatch],
  );
  const handleQrSignatureCancel = useCallback(() => {
    if (confirmationTxData?.id) {
      dispatch(
        rejectPendingApproval(
          confirmationTxData.id,
          serializeError(providerErrors.userRejectedRequest()),
        ),
      );
      dispatch(cancelTx(confirmationTxData as Parameters<typeof cancelTx>[0]));
    }

    if (qrSignRequest) {
      dispatch(cancelQrCodeScan());
    }
  }, [dispatch, qrSignRequest, confirmationTxData]);
  const handleRetry = useCallback(async () => {
    handledConnectionErrorRef.current = null;
    isDeviceDisconnectedRef.current = false;
    dispatchSignatureEvent({ type: HardwareWalletSignatureEvent.Retry });
    if (signatureState.status !== HardwareWalletSignatureStatus.Disconnected) {
      hasStartedSubmission.current = true;
      await submitActiveQuote();
    }
  }, [dispatchSignatureEvent, signatureState.status, submitActiveQuote]);
  const handleCancel = useCallback(() => {
    handleQrSignatureCancel();
    navigateToBridgePage();
  }, [handleQrSignatureCancel, navigateToBridgePage]);

  return (
    <div className="hardware-wallet-signatures">
      <Box
        className="hardware-wallet-signatures__content"
        paddingLeft={4}
        paddingRight={4}
        justifyContent={BoxJustifyContent.Start}
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
      >
        <Box className="hardware-wallet-signatures__device" marginBottom={6}>
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
              <Box className="hardware-wallet-signatures__qr-reader">
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
        >
          {isRetryable && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleRetry}
            >
              {signatureState.status ===
              HardwareWalletSignatureStatus.Disconnected
                ? t('hardwareWalletErrorReconnectButton')
                : t('errorPageTryAgain')}
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
    </div>
  );
}
