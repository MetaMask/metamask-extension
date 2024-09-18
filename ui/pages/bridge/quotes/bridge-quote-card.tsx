import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import {
  getBridgeQuotes,
  getRecommendedQuote,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getQuoteDisplayData } from '../utils/quote';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import { QuoteInfoRow } from './quote-info-row';

export const BridgeQuoteCard = () => {
  const t = useI18nContext();
  const recommendedQuote = useSelector(getRecommendedQuote);
  const { isLoading } = useSelector(getBridgeQuotes);

  const { etaInMinutes, totalFees, quoteRate } =
    getQuoteDisplayData(recommendedQuote);

  const secondsUntilNextRefresh = useCountdownTimer();

  if (isLoading && !recommendedQuote) {
    return (
      <Box>
        <MascotBackgroundAnimation />
      </Box>
    );
  }

  return etaInMinutes && totalFees && quoteRate ? (
    <Box className="quote-card">
      <Box className="bridge-box quote-card__timer">
        <Text>{t('swapNewQuoteIn', [secondsUntilNextRefresh])}</Text>
      </Box>

      <Box className="bridge-box prepare-bridge-page__content quote-card__content">
        <QuoteInfoRow
          label={t('estimatedTime')}
          tooltipText={t('bridgeTimingTooltipText')}
          description={t('bridgeTimingMinutes', [etaInMinutes])}
        />
        <QuoteInfoRow label={t('quoteRate')} description={quoteRate} />
        <QuoteInfoRow
          label={t('totalFees')}
          tooltipText={t('bridgeTotalFeesTooltipText')}
          description={totalFees.fiat}
          secondaryDescription={totalFees?.amount}
        />
      </Box>

      <Box className="bridge-box quote-card__footer">
        <Text>{t('swapIncludesMMFee', [0.875])}</Text>
        <Button variant={ButtonVariant.Link}>
          <Text>{t('termsOfService')}</Text>
        </Button>
      </Box>
    </Box>
  ) : null;
};
