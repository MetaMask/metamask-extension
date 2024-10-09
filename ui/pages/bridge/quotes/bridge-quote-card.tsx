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
import { getQuoteDisplayData } from '../utils/quote';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import { QuoteInfoRow } from './quote-info-row';
import { BridgeQuotesModal } from './bridge-quotes-modal';
import useBridgeQuotes from '../../../hooks/bridge/useBridgeQuotes';
import { getCurrentCurrency } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';

export const BridgeQuoteCard = () => {
  const t = useI18nContext();
  const {
    recommendedQuote,
    quoteMetadata: { gasFees, relayerFees, swapRates },
  } = useBridgeQuotes();

  const { isLoading } = useSelector(getBridgeQuotes);

  const currency = useSelector(getCurrentCurrency);
  const ticker = useSelector(getNativeCurrency);

  const recommendedSwapRate = recommendedQuote?.quote.requestId
    ? swapRates[recommendedQuote.quote.requestId]
    : undefined;
  const { etaInMinutes, totalFees } = getQuoteDisplayData(
    ticker,
    currency,
    recommendedQuote,
    recommendedQuote?.quote.requestId
      ? gasFees[recommendedQuote.quote.requestId]
      : undefined,
    recommendedQuote?.quote.requestId
      ? relayerFees[recommendedQuote.quote.requestId]
      : undefined,
  );

  const secondsUntilNextRefresh = useCountdownTimer();

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  if (isLoading && !recommendedQuote) {
    return (
      <Box>
        <MascotBackgroundAnimation />
      </Box>
    );
  }

  return etaInMinutes && totalFees && recommendedSwapRate ? (
    <Box className="quote-card">
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      <Box className="bridge-box quote-card__timer">
        <Text>{t('swapNewQuoteIn', [secondsUntilNextRefresh])}</Text>
      </Box>

      <Box className="bridge-box prepare-bridge-page__content quote-card__content">
        <QuoteInfoRow
          label={t('estimatedTime')}
          tooltipText={t('bridgeTimingTooltipText')}
          description={t('bridgeTimingMinutes', [etaInMinutes])}
        />
        <QuoteInfoRow
          label={t('quoteRate')}
          description={recommendedSwapRate}
        />
        <QuoteInfoRow
          label={t('totalFees')}
          tooltipText={t('bridgeTotalFeesTooltipText')}
          description={totalFees.fiat}
          secondaryDescription={totalFees?.amount}
        />
      </Box>

      <Box className="bridge-box quote-card__footer">
        <span>
          <Text>{t('swapIncludesMMFee', [0.875])}</Text>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={() => {
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
