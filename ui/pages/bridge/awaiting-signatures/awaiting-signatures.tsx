import React, { useContext, useEffect, useMemo, useRef } from 'react';
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
  const prevQrScanRequestRef = useRef<typeof activeQrCodeScanRequest>(null);

  // Use requestId from URL when popup state is lost (QR fullscreen flow).
  const requestIdFromLocation = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('requestId') || undefined;
  }, [location.search]);

  const hasSubmittedBridgeTx = useMemo(() => {
    const requestId =
      activeQuote?.quote?.requestId ?? requestIdFromLocation ?? undefined;
    if (!requestId) {
      return false;
    }

    // Find bridge history item for this requestId
    const historyItem = Object.values(bridgeHistory).find(
      (item) => item?.quote?.requestId === requestId,
    );

    if (!historyItem) {
      return false;
    }

    // In a two-step flow, a history item is created after approval with approvalTxId.
    // If the history item has approvalTxId, it means approval is done but the bridge
    // transaction hasn't been submitted yet (we're between steps).
    // In that case, hasSubmittedBridgeTx should be false.
    if (historyItem.approvalTxId !== undefined) {
      return false;
    }

    // If no approvalTxId, the history item represents a submitted bridge transaction
    return true;
  }, [activeQuote?.quote?.requestId, bridgeHistory, requestIdFromLocation]);

  // Check if we're between approval and bridge steps in a two-step flow
  const isBetweenApprovalAndBridgeSteps = useMemo(() => {
    const requestId =
      activeQuote?.quote?.requestId ?? requestIdFromLocation ?? undefined;
    if (!requestId) {
      return false;
    }

    // Find bridge history item for this requestId
    const historyItem = Object.values(bridgeHistory).find(
      (item) => item?.quote?.requestId === requestId,
    );

    // If history item exists with approvalTxId but bridge hasn't been submitted,
    // we're between the approval and bridge steps
    return historyItem?.approvalTxId !== undefined && !hasSubmittedBridgeTx;
  }, [
    bridgeHistory,
    activeQuote?.quote?.requestId,
    requestIdFromLocation,
    hasSubmittedBridgeTx,
  ]);

  // Navigate away when transaction completes (success or cancellation)
  useEffect(() => {
    // Success: Transaction is in bridge history
    if (hasSubmittedBridgeTx) {
      navigate(`${DEFAULT_ROUTE}?tab=activity`, {
        replace: true,
        state: { stayOnHomePage: true },
      });
      return;
    }

    // Cancellation: QR scan was active, then cleared (fallback if error handler doesn't fire)
    // Only navigate if we're not in the middle of a two-step approval flow
    const prevQrScanRequest = prevQrScanRequestRef.current;
    prevQrScanRequestRef.current = activeQrCodeScanRequest;

    const qrScanWasCancelled =
      prevQrScanRequest !== null &&
      activeQrCodeScanRequest === null &&
      requestIdFromLocation &&
      !activeQuote &&
      // Don't navigate if we're between approval and bridge steps in two-step flow
      !isBetweenApprovalAndBridgeSteps;

    if (qrScanWasCancelled) {
      navigate(`${DEFAULT_ROUTE}?tab=activity`, {
        replace: true,
        state: { stayOnHomePage: true },
      });
    }
  }, [
    hasSubmittedBridgeTx,
    activeQrCodeScanRequest,
    requestIdFromLocation,
    activeQuote,
    isBetweenApprovalAndBridgeSteps,
    navigate,
  ]);

  useEffect(() => {
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
