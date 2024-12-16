import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  formatCurrencyAmount,
  formatTokenAmount,
  formatEtaInMinutes,
} from '../utils/quote';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import { getCurrentCurrency } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useQuoteProperties } from '../../../hooks/bridge/events/useQuoteProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { BridgeQuotesModal } from './bridge-quotes-modal';
import { QuoteInfoRow } from './quote-info-row';

export const BridgeQuoteCard = () => {
  const t = useI18nContext();
  const { isLoading, isQuoteGoingToRefresh, activeQuote } =
    useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);
  const ticker = useSelector(getNativeCurrency);

  const secondsUntilNextRefresh = useCountdownTimer();

  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const quoteListProperties = useQuoteProperties();

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  if (isLoading && !activeQuote) {
    return (
      <Box>
        <MascotBackgroundAnimation />
      </Box>
    );
  }

  return activeQuote ? (
    <Box className="quote-card">
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      <Box className="bridge-box quote-card__timer">
        {!isLoading && isQuoteGoingToRefresh && (
          <Text>{t('swapNewQuoteIn', [secondsUntilNextRefresh])}</Text>
        )}
      </Box>

      <Box className="bridge-box prepare-bridge-page__content quote-card__content">
        <QuoteInfoRow
          label={t('estimatedTime')}
          tooltipText={t('bridgeTimingTooltipText')}
          description={t('bridgeTimingMinutes', [
            formatEtaInMinutes(activeQuote.estimatedProcessingTimeInSeconds),
          ])}
        />
        {activeQuote.swapRate && (
          <QuoteInfoRow
            label={t('quoteRate')}
            description={`1 ${
              activeQuote.quote.srcAsset.symbol
            } = ${formatTokenAmount(
              activeQuote.swapRate,
              activeQuote.quote.destAsset.symbol,
            )}`}
          />
        )}
        {activeQuote.totalNetworkFee && (
          <QuoteInfoRow
            label={t('totalFees')}
            tooltipText={t('bridgeTotalFeesTooltipText')}
            description={
              formatCurrencyAmount(
                activeQuote.totalNetworkFee?.valueInCurrency,
                currency,
                2,
              ) ??
              formatTokenAmount(activeQuote.totalNetworkFee?.amount, ticker, 6)
            }
            secondaryDescription={
              activeQuote.totalNetworkFee?.valueInCurrency
                ? formatTokenAmount(
                    activeQuote.totalNetworkFee?.amount,
                    ticker,
                    6,
                  )
                : undefined
            }
          />
        )}
      </Box>

      <Box className="bridge-box quote-card__footer">
        <span>
          <Text>{t('swapIncludesMMFee', [0.875])}</Text>
          <Button
            variant={ButtonVariant.Link}
            onClick={() => {
              quoteRequestProperties &&
                requestMetadataProperties &&
                quoteListProperties &&
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.AllQuotesOpened,
                  properties: {
                    ...quoteRequestProperties,
                    ...requestMetadataProperties,
                    ...quoteListProperties,
                  },
                });
              setShowAllQuotes(true);
            }}
          >
            <Text>{t('viewAllQuotes')}</Text>
          </Button>
        </span>
        <Button variant={ButtonVariant.Link}>
          <Text>{t('termsOfService')}</Text>
        </Button>
      </Box>
    </Box>
  ) : null;
};
