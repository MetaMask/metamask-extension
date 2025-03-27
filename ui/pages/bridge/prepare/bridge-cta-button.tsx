import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  ButtonLink,
  ButtonPrimary,
  ButtonPrimarySize,
  Text,
} from '../../../components/component-library';
import {
  getFromAmount,
  getFromChain,
  getFromToken,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
  getWasTxDeclined,
  getQuoteRefreshRate,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import {
  AlignItems,
  BlockSize,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useTradeProperties } from '../../../hooks/bridge/events/useTradeProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { Row } from '../layout';
import { isQuoteExpired as isQuoteExpiredUtil } from '../utils/quote';

export const BridgeCTAButton = ({
  onFetchNewQuotes,
  needsDestinationAddress = false,
}: {
  onFetchNewQuotes: () => void;
  needsDestinationAddress?: boolean;
}) => {
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote, isQuoteGoingToRefresh, quotesLastFetchedMs } =
    useSelector(getBridgeQuotes);
  const refreshRate = useSelector(getQuoteRefreshRate);
  const isQuoteExpired = isQuoteExpiredUtil(
    isQuoteGoingToRefresh,
    refreshRate,
    quotesLastFetchedMs,
  );

  const { submitBridgeTransaction } = useSubmitBridgeTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isNoQuotesAvailable,
    isInsufficientBalance: isInsufficientBalance_,
    isInsufficientGasBalance: isInsufficientGasBalance_,
    isInsufficientGasForQuote: isInsufficientGasForQuote_,
  } = useSelector(getValidationErrors);

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const balanceAmount = useLatestBalance(fromToken);
  const nativeAsset = useMemo(
    () =>
      fromChain?.chainId ? getNativeAssetForChainId(fromChain.chainId) : null,
    [fromChain?.chainId],
  );
  const nativeAssetBalance = useLatestBalance(nativeAsset);

  const isTxSubmittable = useIsTxSubmittable();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const tradeProperties = useTradeProperties();

  const isInsufficientBalance = isInsufficientBalance_(balanceAmount);

  const isInsufficientGasBalance =
    isInsufficientGasBalance_(nativeAssetBalance);
  const isInsufficientGasForQuote =
    isInsufficientGasForQuote_(nativeAssetBalance);

  const label = useMemo(() => {
    if (wasTxDeclined) {
      return 'youDeclinedTheTransaction';
    }

    if (isQuoteExpired) {
      return 'bridgeQuoteExpired';
    }

    if (isLoading && !isTxSubmittable && !activeQuote) {
      return undefined;
    }

    if (isInsufficientGasBalance || isNoQuotesAvailable) {
      return undefined;
    }

    if (isInsufficientBalance || isInsufficientGasForQuote) {
      return 'alertReasonInsufficientBalance';
    }

    if (!fromAmount) {
      if (!toToken) {
        return needsDestinationAddress
          ? 'bridgeSelectTokenAmountAndAccount'
          : 'bridgeSelectTokenAndAmount';
      }
      return needsDestinationAddress
        ? 'bridgeEnterAmountAndSelectAccount'
        : 'bridgeEnterAmount';
    }

    if (needsDestinationAddress) {
      return 'bridgeSelectDestinationAccount';
    }

    if (isTxSubmittable) {
      return 'submit';
    }

    return 'swapSelectToken';
  }, [
    isLoading,
    fromAmount,
    toToken,
    isTxSubmittable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    wasTxDeclined,
    isQuoteExpired,
    needsDestinationAddress,
    activeQuote,
    isNoQuotesAvailable,
  ]);

  // Label for the secondary button that re-starts quote fetching
  const secondaryButtonLabel = useMemo(() => {
    if (wasTxDeclined || isQuoteExpired) {
      return 'bridgeFetchNewQuotes';
    }
    return undefined;
  }, [wasTxDeclined, isQuoteExpired]);

  return activeQuote && !secondaryButtonLabel ? (
    <ButtonPrimary
      width={BlockSize.Full}
      size={activeQuote ? ButtonPrimarySize.Md : ButtonPrimarySize.Lg}
      variant={TextVariant.bodyMd}
      data-testid="bridge-cta-button"
      style={{ boxShadow: 'none' }}
      onClick={async () => {
        if (activeQuote && isTxSubmittable && !isSubmitting) {
          try {
            // We don't need to worry about setting to false if the tx submission succeeds
            // because we route immediately to Activity list page
            setIsSubmitting(true);

            quoteRequestProperties &&
              requestMetadataProperties &&
              tradeProperties &&
              trackCrossChainSwapsEvent({
                event: MetaMetricsEventName.ActionSubmitted,
                properties: {
                  ...quoteRequestProperties,
                  ...requestMetadataProperties,
                  ...tradeProperties,
                },
              });
            await submitBridgeTransaction(activeQuote);
          } finally {
            setIsSubmitting(false);
          }
        }
      }}
      loading={isSubmitting}
      disabled={
        !isTxSubmittable ||
        isQuoteExpired ||
        isSubmitting ||
        needsDestinationAddress
      }
    >
      {label ? t(label) : ''}
    </ButtonPrimary>
  ) : (
    <Row
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={1}
    >
      <Text
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.Center}
        color={TextColor.textAlternativeSoft}
      >
        {label ? t(label) : ''}
      </Text>
      {secondaryButtonLabel && (
        <ButtonLink
          as="a"
          variant={TextVariant.bodyMd}
          style={{ whiteSpace: 'nowrap' }}
          onClick={onFetchNewQuotes}
        >
          {t(secondaryButtonLabel)}
        </ButtonLink>
      )}
    </Row>
  );
};
