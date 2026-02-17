import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import { isCrossChain } from '@metamask/bridge-controller';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  isHardwareWallet,
  getHardwareWalletType,
  getActiveQrCodeScanRequest,
} from '../../../selectors/selectors';
import PulseLoader from '../../../components/ui/pulse-loader';
import {
  TextVariant,
  JustifyContent,
  TextColor,
  BlockSize,
  Display,
  FlexDirection,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  AvatarBase,
  AvatarBaseSize,
  Box,
  Text,
} from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromChain,
  getFromToken,
  getToToken,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function AwaitingSignatures() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const fromAmount = activeQuote?.sentAmount?.amount;
  const fromToken = useSelector(getFromToken, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  const fromChain = useSelector(getFromChain, isEqual);
  const toChain = useSelector(getToChain, isEqual);
  const bridgeHistory = useSelector(selectBridgeHistoryForAccountGroup);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const needsTwoConfirmations = Boolean(activeQuote?.approval);
  const { trackEvent } = useContext(MetaMetricsContext);
  // Refs to track state transitions for navigation logic
  const prevQrScanRequestRef = useRef<typeof activeQrCodeScanRequest>(null);
  const hasTrackedEventRef = useRef(false);
  const hasSeenQrScanActiveRef = useRef<boolean>(false);
  const hasSeenRequestIdRef = useRef<boolean>(false);
  const hasSeenActiveQuoteRef = useRef<boolean>(false);

  // Extract requestId from URL params (used when popup state is lost in QR fullscreen flow)
  const requestIdFromLocation = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('requestId') || undefined;
  }, [location.search]);

  // Resolve requestId from activeQuote (popup mode) or URL params (fullscreen mode)
  const requestId = useMemo(
    () => activeQuote?.quote?.requestId ?? requestIdFromLocation ?? undefined,
    [activeQuote?.quote?.requestId, requestIdFromLocation],
  );

  // Find bridge history item for this requestId
  const historyItem = useMemo(() => {
    if (!requestId) {
      return undefined;
    }

    return Object.values(bridgeHistory).find(
      (item) => item?.quote?.requestId === requestId,
    );
  }, [bridgeHistory, requestId]);

  // Check if the bridge transaction has been submitted to the network
  // In two-step flows, a history item with approvalTxId means we're between steps
  const hasSubmittedBridgeTx = useMemo(() => {
    if (!historyItem) {
      return false;
    }

    // History item with approvalTxId means approval is done but bridge tx not submitted yet
    if (historyItem.approvalTxId !== undefined) {
      return false;
    }

    // No approvalTxId means this is the final bridge transaction
    return true;
  }, [historyItem]);

  // Check if we're between approval and bridge steps in a two-step flow
  const isBetweenApprovalAndBridgeSteps = useMemo(() => {
    return historyItem?.approvalTxId !== undefined && !hasSubmittedBridgeTx;
  }, [historyItem, hasSubmittedBridgeTx]);

  // Navigate to activity tab with consistent options
  const navigateToActivity = useCallback(() => {
    navigate(`${DEFAULT_ROUTE}?tab=activity`, {
      replace: true,
      state: { stayOnHomePage: true },
    });
  }, [navigate]);

  // Navigate away when transaction completes (success or cancellation/failure)
  useEffect(() => {
    // Success: Transaction is in bridge history
    if (hasSubmittedBridgeTx) {
      navigateToActivity();
      return;
    }

    // Don't navigate if we're between approval and bridge steps in two-step flow
    if (isBetweenApprovalAndBridgeSteps) {
      return;
    }

    // Track if we've seen a requestId (indicates transaction was initiated)
    if (requestId) {
      hasSeenRequestIdRef.current = true;
    }

    // Track if we've seen activeQuote (indicates transaction was actually started)
    if (activeQuote !== null && activeQuote !== undefined) {
      hasSeenActiveQuoteRef.current = true;
    }

    // Track QR scan state transitions
    const prevQrScanRequest = prevQrScanRequestRef.current;

    // Mark QR scan as seen when it becomes active (truthy object)
    if (activeQrCodeScanRequest !== null && activeQrCodeScanRequest !== false) {
      hasSeenQrScanActiveRef.current = true;
    }

    prevQrScanRequestRef.current = activeQrCodeScanRequest;

    // Detect cancellation/failure scenarios:
    // 1. QR scan cancellation: QR scan was active, then cleared, and no activeQuote
    //    (handles popup-initiated cancellations where activeQuote gets cleared)
    const qrScanWasCancelled =
      prevQrScanRequest !== null &&
      activeQrCodeScanRequest === null &&
      requestId &&
      !activeQuote;

    // 2. Fullscreen-initiated failure: QR scan was active then cleared, but activeQuote
    //    doesn't get cleared in fullscreen mode (fallback when error handler doesn't fire)
    const qrScanWasActiveThenCleared =
      hasSeenQrScanActiveRef.current && activeQrCodeScanRequest === null;
    const fullscreenInitiatedFailure =
      requestIdFromLocation !== undefined &&
      hasSeenRequestIdRef.current &&
      !hasSubmittedBridgeTx &&
      qrScanWasActiveThenCleared &&
      !isBetweenApprovalAndBridgeSteps;

    // 3. Popup-initiated failure: Transaction was initiated (we saw activeQuote) but now cleared
    //    (activeQuote gets cleared in popup mode when transaction fails)
    //    Only trigger if we've actually seen the transaction start (activeQuote was present)
    const transactionFailed =
      hasSeenActiveQuoteRef.current &&
      requestId &&
      !activeQuote &&
      !historyItem &&
      !activeQrCodeScanRequest;

    // Navigate on any failure/cancellation scenario
    if (qrScanWasCancelled || fullscreenInitiatedFailure || transactionFailed) {
      navigateToActivity();
    }
  }, [
    hasSubmittedBridgeTx,
    activeQrCodeScanRequest,
    requestId,
    requestIdFromLocation,
    activeQuote,
    historyItem,
    isBetweenApprovalAndBridgeSteps,
    navigateToActivity,
  ]);

  useEffect(() => {
    // Only track the event once on mount to avoid duplicate events when dependencies change
    // (e.g., when activeQuote becomes null during popup-to-fullscreen transition)
    if (hasTrackedEventRef.current) {
      return;
    }

    // Only fire if we have valid quote data to avoid sending empty values
    if (!activeQuote) {
      return;
    }

    hasTrackedEventRef.current = true;
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

  const isSwap =
    fromChain && !isCrossChain(fromChain.chainId, toChain?.chainId);

  return (
    <div className="awaiting-bridge-signatures">
      <Box
        paddingLeft={6}
        paddingRight={6}
        height={BlockSize.Full}
        justifyContent={JustifyContent.center}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <Box marginTop={3} marginBottom={4}>
          <PulseLoader />
        </Box>
        {!needsTwoConfirmations && (
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.headingMd}
            as="h3"
          >
            {t('swapConfirmWithHwWallet')}
          </Text>
        )}
        {needsTwoConfirmations && activeQuote && (
          <>
            <Text variant={TextVariant.bodyMdBold} marginTop={2}>
              {t('bridgeConfirmTwoTransactions')}
            </Text>
            <ul className="awaiting-bridge-signatures__steps">
              <li>
                <AvatarBase
                  size={AvatarBaseSize.Sm}
                  backgroundColor={BackgroundColor.primaryMuted}
                  color={TextColor.primaryDefault}
                  marginRight={2}
                >
                  1
                </AvatarBase>
                {t(
                  isSwap
                    ? 'unifiedSwapAllowSwappingOf'
                    : 'bridgeAllowSwappingOf',
                  [
                    activeQuote.sentAmount?.amount,
                    fromToken?.symbol,
                    fromChain?.name,
                  ],
                )}
              </li>
              <li>
                <AvatarBase
                  size={AvatarBaseSize.Sm}
                  backgroundColor={BackgroundColor.primaryMuted}
                  color={TextColor.primaryDefault}
                  marginRight={2}
                >
                  2
                </AvatarBase>
                {t(isSwap ? 'unifiedSwapFromTo' : 'bridgeFromTo', [
                  fromAmount,
                  fromToken?.symbol,
                  isSwap ? toToken?.symbol : toChain?.name,
                ])}
              </li>
            </ul>
            <Text variant={TextVariant.bodyXs}>{t('bridgeGasFeesSplit')}</Text>
          </>
        )}
      </Box>
    </div>
  );
}
