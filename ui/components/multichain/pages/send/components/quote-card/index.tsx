import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Text } from '../../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import {
  getCurrentDraftTransaction,
  getBestQuote,
  updateSendQuote,
} from '../../../../../../ducks/send';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SECOND } from '../../../../../../../shared/constants/time';
import { Quote } from '../../../../../../ducks/send/swap-and-send-utils';
import Tooltip from '../../../../../ui/tooltip';
import InfoTooltipIcon from '../../../../../ui/info-tooltip/info-tooltip-icon';
import { MetaMetricsEventCategory } from '../../../../../../../shared/constants/metametrics';
import { GAS_FEES_LEARN_MORE_URL } from '../../../../../../../shared/lib/ui-utils';
import { MetaMetricsContext } from '../../../../../../contexts/metametrics';
import useEthFeeData from './hooks/useEthFeeData';
import useTranslatedNetworkName from './hooks/useTranslatedNetworkName';
import useGetConversionRate from './hooks/useGetConversionRate';

const REFRESH_INTERVAL = 30;

/**
 * All the info about the current quote; handles polling and displaying the best quote
 */
export function QuoteCard() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const translatedNetworkName = useTranslatedNetworkName();
  const trackEvent = useContext(MetaMetricsContext);

  const scrollRef = useRef<HTMLElement>(null);

  const { isSwapQuoteLoading } = useSelector(getCurrentDraftTransaction);

  const bestQuote: Quote | undefined = useSelector(getBestQuote);

  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);

  const { formattedEthGasFee, formattedFiatGasFee } = useEthFeeData(
    bestQuote?.gasParams.maxGas,
  );

  const formattedConversionRate = useGetConversionRate();

  const prevBestQuote = useRef(bestQuote);

  useEffect(() => {
    const isQuoteJustLoaded = bestQuote && prevBestQuote.current === undefined;

    prevBestQuote.current = bestQuote;
    // scroll to quote on initial load
    if (isQuoteJustLoaded) {
      scrollRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    if (bestQuote) {
      setTimeLeft(REFRESH_INTERVAL);
    } else {
      setTimeLeft(undefined);
    }
  }, [bestQuote]);

  useEffect(() => {
    if (isSwapQuoteLoading || timeLeft === undefined) {
      return;
    }

    if (timeLeft <= 0) {
      dispatch(updateSendQuote(false, true));
    }

    const timeout = setTimeout(() => setTimeLeft(timeLeft - 1), SECOND);
    // eslint-disable-next-line consistent-return
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  const infoText = useMemo(() => {
    if (isSwapQuoteLoading) {
      return t('swapFetchingQuotes');
    } else if (bestQuote) {
      return timeLeft ? t('swapNewQuoteIn', [timeLeft]) : undefined;
    }
    return undefined;
  }, [isSwapQuoteLoading, bestQuote, timeLeft]);

  return (
    <Box
      ref={scrollRef}
      display={Display.Flex}
      paddingBottom={4}
      flexDirection={FlexDirection.Column}
      alignItems={isSwapQuoteLoading ? AlignItems.center : AlignItems.flexStart}
      gap={3}
    >
      {infoText && (
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodySm}
          className="quote-card__fetch-status"
        >
          {infoText}
        </Text>
      )}
      {bestQuote && (
        <Box
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.LG}
          width={BlockSize.Full}
          gap={2}
          padding={3}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Text
              className="quote-card__text"
              color={TextColor.textAlternative}
              marginRight={'auto'}
              variant={TextVariant.bodySm}
            >
              {t('quoteRate')}
            </Text>
            <Text marginLeft={'auto'} variant={TextVariant.bodySm}>
              {formattedConversionRate}
            </Text>
          </Box>
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Text
              display={Display.Flex}
              color={TextColor.textAlternative}
              marginRight={'auto'}
              gap={1}
              alignItems={AlignItems.center}
              variant={TextVariant.bodySm}
            >
              {t('transactionDetailGasHeading')}
              <Tooltip
                interactive
                position="left"
                containerClassName="info-tooltip__tooltip-container"
                tooltipInnerClassName="info-tooltip__tooltip-content"
                tooltipArrowClassName="info-tooltip__left-tooltip-arrow"
                style={{ display: 'flex', height: '12px', aspectRatio: '1' }}
                html={
                  <>
                    <p>{t('swapGasFeesSummary', [translatedNetworkName])}</p>
                    <p>{t('swapGasFeesDetails')}</p>
                    <p>
                      <a
                        onClick={() => {
                          /* istanbul ignore next */
                          trackEvent({
                            event: 'Clicked "Gas Fees: Learn More" Link',
                            // TODO: update for swap and send
                            category: MetaMetricsEventCategory.Swaps,
                          });
                          global.platform.openTab({
                            url: GAS_FEES_LEARN_MORE_URL,
                          });
                        }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('swapGasFeesLearnMore')}
                      </a>
                    </p>
                  </>
                }
                theme="tippy-tooltip-info"
              >
                <InfoTooltipIcon fillColor="var(--color-icon-alternative)" />
              </Tooltip>
            </Text>
            <Box display={Display.Flex} marginLeft={'auto'}>
              <Text variant={TextVariant.bodySm}>{formattedEthGasFee}</Text>
              {formattedFiatGasFee && (
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySm}
                  marginLeft={1}
                >
                  ≈ {formattedFiatGasFee}
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
