import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
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
  getBridgeQuotesConfig,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import {
  BlockSize,
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
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../../shared/constants/swaps';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';

export const BridgeCTAButton = () => {
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote, isQuoteGoingToRefresh, quotesRefreshCount } =
    useSelector(getBridgeQuotes);
  const { maxRefreshCount, refreshRate } = useSelector(getBridgeQuotesConfig);

  const { submitBridgeTransaction } = useSubmitBridgeTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isNoQuotesAvailable,
    isInsufficientBalance: isInsufficientBalance_,
    isInsufficientGasBalance: isInsufficientGasBalance_,
    isInsufficientGasForQuote: isInsufficientGasForQuote_,
  } = useSelector(getValidationErrors);

  const { balanceAmount } = useLatestBalance(fromToken, fromChain?.chainId);
  const { balanceAmount: nativeAssetBalance } = useLatestBalance(
    fromChain?.chainId
      ? SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
          fromChain.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
        ]
      : null,
    fromChain?.chainId,
  );

  const isTxSubmittable = useIsTxSubmittable();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const tradeProperties = useTradeProperties();

  const ticker = useSelector(getNativeCurrency);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

  const isInsufficientBalance = isInsufficientBalance_(balanceAmount);

  const isInsufficientGasBalance =
    isInsufficientGasBalance_(nativeAssetBalance);
  const isInsufficientGasForQuote =
    isInsufficientGasForQuote_(nativeAssetBalance);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    // Reset the isQuoteExpired if quote fethching restarts
    if (quotesRefreshCount === 0) {
      setIsQuoteExpired(false);
      return () => clearTimeout(timeout);
    }
    // After the last quote refresh, set a timeout to expire the quote and disable the CTA
    if (quotesRefreshCount >= maxRefreshCount && !isQuoteGoingToRefresh) {
      timeout = setTimeout(() => {
        setIsQuoteExpired(true);
      }, refreshRate);
    }
    return () => clearTimeout(timeout);
  }, [isQuoteGoingToRefresh, quotesRefreshCount]);

  const label = useMemo(() => {
    if (isQuoteExpired) {
      return t('bridgeQuoteExpired');
    }

    if (isLoading && !isTxSubmittable) {
      return '';
    }

    if (isInsufficientGasBalance || isNoQuotesAvailable) {
      return '';
    }

    if (isInsufficientBalance || isInsufficientGasForQuote) {
      return t('alertReasonInsufficientBalance');
    }

    if (!fromAmount) {
      if (!toToken) {
        return t('bridgeSelectTokenAndAmount');
      }
      return t('bridgeEnterAmount');
    }

    if (isTxSubmittable) {
      return t('submit');
    }

    return t('swapSelectToken');
  }, [
    isLoading,
    fromAmount,
    toToken,
    ticker,
    isTxSubmittable,
    balanceAmount,
    isInsufficientBalance,
    isQuoteExpired,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isQuoteExpired,
  ]);

  return activeQuote ? (
    <ButtonPrimary
      width={BlockSize.Full}
      size={activeQuote ? ButtonPrimarySize.Md : ButtonPrimarySize.Lg}
      variant={TextVariant.bodyMd}
      data-testid="bridge-cta-button"
      style={{ boxShadow: 'none' }}
      onClick={() => {
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
            submitBridgeTransaction(activeQuote);
          } finally {
            setIsSubmitting(false);
          }
        }
      }}
      loading={isSubmitting}
      disabled={!isTxSubmittable || isQuoteExpired || isSubmitting}
    >
      {label}
    </ButtonPrimary>
  ) : (
    <Text
      variant={TextVariant.bodyMd}
      width={BlockSize.Full}
      textAlign={TextAlign.Center}
      color={TextColor.textAlternativeSoft}
    >
      {label}
    </Text>
  );
};
