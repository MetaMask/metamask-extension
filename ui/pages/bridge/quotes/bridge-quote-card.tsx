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
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import { formatEtaInMinutes } from '../utils/quote';
import { QuoteInfoRow } from './quote-info-row';
import { BridgeQuotesModal } from './bridge-quotes-modal';

export const BridgeQuoteCard = () => {
  const t = useI18nContext();
  const { isLoading, isQuoteGoingToRefresh, activeQuote } =
    useSelector(getBridgeQuotes);

  const secondsUntilNextRefresh = useCountdownTimer();

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
        <QuoteInfoRow
          label={t('quoteRate')}
          description={activeQuote.swapRate.toString()}
        />
        <QuoteInfoRow
          label={t('totalFees')}
          tooltipText={t('bridgeTotalFeesTooltipText')}
          description={activeQuote.totalNetworkFee?.fiat?.toString() ?? ''}
          secondaryDescription={activeQuote.totalNetworkFee?.raw?.toString()}
        />
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
