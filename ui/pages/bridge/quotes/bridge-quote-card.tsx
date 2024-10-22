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
import { formatEtaInMinutes } from '../utils/quote';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import useBridgeQuotes from '../../../hooks/bridge/useBridgeQuotes';
import { getCurrentCurrency } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { BridgeQuotesModal } from './bridge-quotes-modal';
import { QuoteInfoRow } from './quote-info-row';

export const BridgeQuoteCard = () => {
  const t = useI18nContext();
  const { recommendedQuote } = useBridgeQuotes();

  const { totalNetworkFee } = recommendedQuote ?? {};
  const { isLoading } = useSelector(getBridgeQuotes);

  const currency = useSelector(getCurrentCurrency);
  const ticker = useSelector(getNativeCurrency);

  const secondsUntilNextRefresh = useCountdownTimer();

  const [showAllQuotes, setShowAllQuotes] = useState(false);

  if (isLoading && !recommendedQuote) {
    return (
      <Box>
        <MascotBackgroundAnimation />
      </Box>
    );
  }

  return recommendedQuote ? (
    <Box className="quote-card">
      <BridgeQuotesModal
        isOpen={showAllQuotes}
        onClose={() => setShowAllQuotes(false)}
      />
      <Box className="bridge-box quote-card__timer">
        {!isLoading && (
          <Text>{t('swapNewQuoteIn', [secondsUntilNextRefresh])}</Text>
        )}
      </Box>

      <Box className="bridge-box prepare-bridge-page__content quote-card__content">
        <QuoteInfoRow
          label={t('estimatedTime')}
          tooltipText={t('bridgeTimingTooltipText')}
          description={t('bridgeTimingMinutes', [
            formatEtaInMinutes(
              recommendedQuote.estimatedProcessingTimeInSeconds,
            ),
          ])}
        />
        {recommendedQuote.swapRate && (
          <QuoteInfoRow
            label={t('quoteRate')}
            description={`1 ${
              recommendedQuote.quote.srcAsset.symbol
            } = ${recommendedQuote.swapRate.toFixed(2)}`}
          />
        )}
        {totalNetworkFee && (
          <QuoteInfoRow
            label={t('totalFees')}
            tooltipText={t('bridgeTotalFeesTooltipText')}
            description={totalNetworkFee?.fiat.toFixed(2)}
            secondaryDescription={totalNetworkFee?.raw.toFixed(6)}
          />
        )}
      </Box>

      <Box className="bridge-box quote-card__footer">
        <span>
          <Text>{t('swapIncludesMMFee', [0.875])}</Text>
          <Button
            variant={ButtonVariant.Link}
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
