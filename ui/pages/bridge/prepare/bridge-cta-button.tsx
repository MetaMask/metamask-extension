import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
  getBridgeQuotesConfig,
  getWasTxDeclined,
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
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../../shared/constants/swaps';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { Row } from '../layout';
import { isQuoteExpired as isQuoteExpiredUtil } from '../utils/quote';

export const BridgeCTAButton = ({
  onFetchNewQuotes,
}: {
  onFetchNewQuotes: () => void;
}) => {
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote, isQuoteGoingToRefresh, quotesLastFetchedMs } =
    useSelector(getBridgeQuotes);
  const { refreshRate } = useSelector(getBridgeQuotesConfig);
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

  const isInsufficientBalance = isInsufficientBalance_(balanceAmount);

  const isInsufficientGasBalance =
    isInsufficientGasBalance_(nativeAssetBalance);
  const isInsufficientGasForQuote =
    isInsufficientGasForQuote_(nativeAssetBalance);

  const label = useMemo(() => {
    if (wasTxDeclined) {
      return t('youDeclinedTheTransaction');
    }

    if (isQuoteExpired) {
      return t('bridgeQuoteExpired');
    }

    if (isLoading && !isTxSubmittable && !activeQuote) {
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
    wasTxDeclined,
    isQuoteExpired,
  ]);

  // Label for the secondary button that re-starts quote fetching
  const secondaryButtonLabel = useMemo(() => {
    if (wasTxDeclined || isQuoteExpired) {
      return t('bridgeFetchNewQuotes');
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
      disabled={!isTxSubmittable || isQuoteExpired || isSubmitting}
    >
      {label}
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
        {label}
      </Text>
      {secondaryButtonLabel && (
        <ButtonLink
          as="a"
          variant={TextVariant.bodyMd}
          style={{ whiteSpace: 'nowrap' }}
          onClick={onFetchNewQuotes}
        >
          {secondaryButtonLabel}
        </ButtonLink>
      )}
    </Row>
  );
};
