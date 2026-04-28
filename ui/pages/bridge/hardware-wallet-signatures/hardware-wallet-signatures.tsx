import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { QRCodeSVG } from 'qrcode.react';
import { UR, UREncoder } from '@ngraveio/bc-ur';
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
  Icon,
  IconColor,
  IconName,
  IconSize,
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
import PulseLoader from '../../../components/ui/pulse-loader';
import Reader from '../../../components/app/qr-hardware-popover/qr-hardware-sign-request/reader';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
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
  hasApprovalTxForRequestId,
  getStepStatus,
  getTitle,
  getTransactionToAddress,
} from './hardware-wallet-signatures.utils';

type BridgeStatusState = {
  metamask: {
    txHistory?: Record<
      string,
      {
        approvalTxId?: string;
        quote?: {
          requestId?: string;
        };
      }
    >;
  };
  confirmTransaction?: {
    txData?: {
      id?: string;
    } & Record<string, unknown>;
  };
};

type QrHardwareSignRequest = {
  type: QrScanRequestType.SIGN;
  request: {
    requestId: string;
    payload: {
      type: string;
      cbor: string;
    };
  };
};

const QR_FRAGMENT_SIZE = 200;
const QR_REFRESH_RATE = 200;
const QR_CODE_SIZE = 240;

const isQrHardwareSignRequest = (
  request: unknown,
): request is QrHardwareSignRequest =>
  Boolean(
    request &&
      typeof request === 'object' &&
      'type' in request &&
      request.type === QrScanRequestType.SIGN &&
      'request' in request &&
      request.request &&
      typeof request.request === 'object' &&
      'requestId' in request.request &&
      typeof request.request.requestId === 'string' &&
      'payload' in request.request &&
      request.request.payload &&
      typeof request.request.payload === 'object' &&
      'type' in request.request.payload &&
      typeof request.request.payload.type === 'string' &&
      'cbor' in request.request.payload &&
      typeof request.request.payload.cbor === 'string',
  );

const QrSignatureCode = ({
  payload,
}: {
  payload: QrHardwareSignRequest['request']['payload'];
}) => {
  const urEncoder = useMemo(
    () =>
      new UREncoder(
        new UR(Buffer.from(payload.cbor, 'hex'), payload.type),
        QR_FRAGMENT_SIZE,
      ),
    [payload.cbor, payload.type],
  );
  const [currentQrCode, setCurrentQrCode] = useState(() =>
    urEncoder.nextPart(),
  );

  useEffect(() => {
    setCurrentQrCode(urEncoder.nextPart());
    const intervalId = setInterval(() => {
      setCurrentQrCode(urEncoder.nextPart());
    }, QR_REFRESH_RATE);

    return () => clearInterval(intervalId);
  }, [urEncoder]);

  return (
    <Box className="hardware-wallet-signatures__qr-code">
      <QRCodeSVG value={currentQrCode.toUpperCase()} size={QR_CODE_SIZE} />
    </Box>
  );
};

const SignatureStatusIcon = ({
  status,
  stepNumber,
}: {
  status: SignatureStepStatus;
  stepNumber: number;
}) => {
  if (status === SignatureStepStatus.Complete) {
    return (
      <Box className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--complete">
        <Icon
          name={IconName.Check}
          size={IconSize.Sm}
          color={IconColor.SuccessDefault}
        />
      </Box>
    );
  }

  if (
    status === SignatureStepStatus.Rejected ||
    status === SignatureStepStatus.Failed
  ) {
    return (
      <Box className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--rejected">
        <Icon
          name={IconName.CircleX}
          size={IconSize.Sm}
          color={IconColor.ErrorDefault}
        />
      </Box>
    );
  }

  if (status === SignatureStepStatus.Active) {
    return (
      <Box className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--active">
        <PulseLoader />
      </Box>
    );
  }

  return (
    <Box className="hardware-wallet-signatures__step-icon">{stepNumber}</Box>
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function HardwareWalletSignatures() {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const fromAmount = activeQuote?.sentAmount?.amount;
  const fromToken = useSelector(getFromToken, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const needsTwoConfirmations = Boolean(activeQuote?.approval);
  const { trackEvent } = useContext(MetaMetricsContext);
  const { navigateToBridgePage } = useBridgeNavigation();
  const [signatureState, dispatchSignatureEvent] = useReducer(
    hardwareWalletSignaturesReducer,
    needsTwoConfirmations,
    getInitialHardwareWalletSignaturesState,
  );
  const signatureStatusRef = useRef(signatureState.status);
  const hasStartedSubmission = useRef(false);
  const hasTrackedFirstSignature = useRef(false);
  const hasTrackedPageView = useRef(false);
  const quoteRequestIdRef = useRef<string | undefined>();
  const [isReadingQrSignature, setIsReadingQrSignature] = useState(false);
  const isQrHardwareWallet =
    hardwareWalletType === HardwareKeyringType.qr ||
    isQrHardwareSignRequest(activeQrCodeScanRequest);
  const qrSignRequest =
    isQrHardwareWallet && isQrHardwareSignRequest(activeQrCodeScanRequest)
      ? activeQrCodeScanRequest
      : undefined;
  const hasApprovalTxSubmitted = useSelector((state: BridgeStatusState) => {
    const requestId = activeQuote?.quote.requestId;

    return hasApprovalTxForRequestId(state.metamask.txHistory, requestId);
  });
  const qrTxData = useSelector(
    (state: BridgeStatusState) => state.confirmTransaction?.txData,
  );
  useEffect(() => {
    signatureStatusRef.current = signatureState.status;
  }, [signatureState.status]);
  const handleHardwareWalletSubmitted = useCallback(() => {
    if (
      needsTwoConfirmations &&
      signatureStatusRef.current ===
        HardwareWalletSignatureStatus.AwaitingFirstSignature
    ) {
      signatureStatusRef.current =
        HardwareWalletSignatureStatus.AwaitingFinalSignature;
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
      return;
    }

    signatureStatusRef.current = HardwareWalletSignatureStatus.Submitted;
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  }, [needsTwoConfirmations]);
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
    if (!activeQuote) {
      return;
    }

    await submitBridgeTransaction(activeQuote);
  }, [activeQuote, submitBridgeTransaction]);

  useEffect(() => {
    setIsReadingQrSignature(false);
  }, [qrSignRequest?.request.requestId]);

  useEffect(() => {
    if (hasTrackedPageView.current || !activeQuote) {
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
        token_from_amount: activeQuote?.quote?.srcTokenAmount ?? '',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_to_amount: activeQuote?.quote?.destTokenAmount ?? '',
      },
    });
  }, [
    activeQuote,
    activeQuote?.quote?.destTokenAmount,
    activeQuote?.quote?.srcTokenAmount,
    fromToken?.symbol,
    hardwareWalletType,
    hardwareWalletUsed,
    needsTwoConfirmations,
    toToken?.symbol,
    trackEvent,
  ]);

  useEffect(() => {
    const requestId = activeQuote?.quote.requestId;

    if (!requestId || quoteRequestIdRef.current === requestId) {
      return;
    }

    quoteRequestIdRef.current = requestId;
    hasStartedSubmission.current = false;
    hasTrackedFirstSignature.current = false;
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });
  }, [activeQuote?.quote.requestId, needsTwoConfirmations]);

  useEffect(() => {
    if (hasStartedSubmission.current || !activeQuote) {
      return;
    }

    hasStartedSubmission.current = true;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    submitActiveQuote();
  }, [activeQuote, submitActiveQuote]);

  useEffect(() => {
    if (
      hasTrackedFirstSignature.current ||
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFirstSignature ||
      !hasApprovalTxSubmitted
    ) {
      return;
    }

    hasTrackedFirstSignature.current = true;
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  }, [hasApprovalTxSubmitted, signatureState.status]);

  const toAddress = getTransactionToAddress(activeQuote?.trade);
  const spenderAddress = getTransactionToAddress(activeQuote?.approval);
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
          <Icon
            name={IconName.Hardware}
            size={IconSize.Xl}
            color={IconColor.PrimaryDefault}
          />
        </Box>
        <Text
          className="hardware-wallet-signatures__title"
          color={TextColor.TextDefault}
          variant={TextVariant.HeadingLg}
        >
          {displayedTitle}
        </Text>
        {activeQuote && (
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
