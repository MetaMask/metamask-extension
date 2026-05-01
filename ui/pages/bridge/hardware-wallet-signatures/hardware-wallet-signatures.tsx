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
  getTransactionToAddress,
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
  const { navigateToBridgePage } = useBridgeNavigation();
  const [signatureState, dispatchSignatureEvent] = useReducer(
    hardwareWalletSignaturesReducer,
    needsTwoConfirmations,
    getInitialHardwareWalletSignaturesState,
  );
  const hasStartedSubmission = useRef(false);
  const hasTrackedPageView = useRef(false);
  const quoteRequestIdRef = useRef<string | undefined>();
  const handledConnectionErrorRef = useRef<unknown>(null);
  const [isReadingQrSignature, setIsReadingQrSignature] = useState(false);
  const isQrHardwareWallet =
    hardwareWalletType === HardwareKeyringType.qr ||
    isQrHardwareSignRequest(activeQrCodeScanRequest);
  const qrSignRequest =
    isQrHardwareWallet && isQrHardwareSignRequest(activeQrCodeScanRequest)
      ? activeQrCodeScanRequest
      : undefined;
  const qrTxData = useSelector(
    (state: BridgeStatusState) => state.confirmTransaction?.txData,
  );
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
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  }, []);
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
  }, [qrSignRequest?.request.requestId]);

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
    lockedQuote?.quote?.destTokenAmount,
    lockedQuote?.quote?.srcTokenAmount,
    needsTwoConfirmations,
    toToken?.symbol,
    trackEvent,
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    submitActiveQuote();
  }, [lockedQuote, submitActiveQuote]);

  const fromAddress = (lockedQuote?.trade as { from?: string })?.from;

  useHwBatchSignTracker(
    fromAddress,
    hardwareWalletUsed,
    needsTwoConfirmations,
    dispatchSignatureEvent,
  );

  useEffect(() => {
    if (connectionState.status !== ConnectionStatus.ErrorState) {
      handledConnectionErrorRef.current = null;
      return;
    }

    if (handledConnectionErrorRef.current === connectionState.error) {
      return;
    }

    if (
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFirstSignature &&
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFinalSignature
    ) {
      return;
    }

    handledConnectionErrorRef.current = connectionState.error;
    dispatchSignatureEvent({
      type: isUserRejectedHardwareWalletError(connectionState.error)
        ? HardwareWalletSignatureEvent.TransactionRejected
        : HardwareWalletSignatureEvent.TransactionFailed,
    });
  }, [connectionState, signatureState.status]);

  const toAddress = getTransactionToAddress(lockedQuote?.trade);
  const spenderAddress = getTransactionToAddress(lockedQuote?.approval);
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
  const isRejectedOrFailed =
    signatureState.status === HardwareWalletSignatureStatus.Rejected ||
    signatureState.status === HardwareWalletSignatureStatus.Failed;
  const showFooter =
    signatureState.status !== HardwareWalletSignatureStatus.Submitted;
  const title = getTitle({
    status: signatureState.status,
    needsTwoConfirmations,
    t,
  });
  const activeSignatureStep =
    signatureState.status ===
    HardwareWalletSignatureStatus.AwaitingFirstSignature
      ? 1
      : 2;
  const showInlineQrSigning =
    Boolean(qrSignRequest) &&
    (signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature ||
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature);
  const displayedTitle = showInlineQrSigning
    ? t('bridgeQrHardwareSignTitle', [
        activeSignatureStep,
        needsTwoConfirmations ? 2 : 1,
      ])
    : title;
  const activeQrStep =
    showInlineQrSigning && !isReadingQrSignature
      ? signatureState.status
      : undefined;
  const handleQrScanSuccess = useCallback(
    (response: SerializedUR) => dispatch(completeQrCodeScan(response)),
    [dispatch],
  );
  const handleQrSignatureCancel = useCallback(() => {
    if (qrTxData?.id) {
      dispatch(
        rejectPendingApproval(
          qrTxData.id,
          serializeError(providerErrors.userRejectedRequest()),
        ),
      );
      dispatch(cancelTx(qrTxData as Parameters<typeof cancelTx>[0]));
    }

    if (qrSignRequest) {
      dispatch(cancelQrCodeScan());
    }
  }, [dispatch, qrSignRequest, qrTxData]);
  const handleRetry = async () => {
    handledConnectionErrorRef.current = null;
    dispatchSignatureEvent({ type: HardwareWalletSignatureEvent.Retry });
    hasStartedSubmission.current = true;
    await submitActiveQuote();
  };
  const handleCancel = () => {
    handleQrSignatureCancel();
    navigateToBridgePage();
  };

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
                        firstStepStatus === SignatureStepStatus.Failed
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
                      finalStepStatus === SignatureStepStatus.Failed
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
          {isRejectedOrFailed && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleRetry}
            >
              {t('errorPageTryAgain')}
            </Button>
          )}
          {showInlineQrSigning && !isRejectedOrFailed && (
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
