import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { type BigNumber } from 'bignumber.js';
import {
  ButtonLink,
  ButtonPrimary,
  ButtonPrimarySize,
  Text,
} from '../../../components/component-library';
import {
  getFromAmount,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
  getWasTxDeclined,
  getIsQuoteExpired,
  BridgeAppState,
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
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useTradeProperties } from '../../../hooks/bridge/events/useTradeProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { Row } from '../layout';

export const BridgeCTAButton = ({
  onFetchNewQuotes,
  needsDestinationAddress = false,
  nativeAssetBalance,
  srcTokenBalance,
}: {
  nativeAssetBalance?: BigNumber;
  srcTokenBalance?: BigNumber;
  onFetchNewQuotes: () => void;
  needsDestinationAddress?: boolean;
}) => {
  const t = useI18nContext();

  const toToken = useSelector(getToToken);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
  );
  const { submitBridgeTransaction } = useSubmitBridgeTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isNoQuotesAvailable,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    isInsufficientBalance: isInsufficientBalance_,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    isInsufficientGasBalance: isInsufficientGasBalance_,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    isInsufficientGasForQuote: isInsufficientGasForQuote_,
    isTxAlertPresent,
  } = useSelector(getValidationErrors);

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const isTxSubmittable = useIsTxSubmittable(
    nativeAssetBalance,
    srcTokenBalance,
  );
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const tradeProperties = useTradeProperties();

  const isInsufficientBalance = isInsufficientBalance_(srcTokenBalance);

  const isInsufficientGasBalance =
    isInsufficientGasBalance_(nativeAssetBalance);
  const isInsufficientGasForQuote =
    isInsufficientGasForQuote_(nativeAssetBalance);

  const label = useMemo(() => {
    if (wasTxDeclined) {
      return 'youDeclinedTheTransaction';
    }

    if (isQuoteExpired && !isLoading) {
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

    if (isTxSubmittable || isTxAlertPresent) {
      return 'submit';
    }

    return 'swapSelectToken';
  }, [
    isLoading,
    isTxAlertPresent,
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        isTxAlertPresent ||
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
