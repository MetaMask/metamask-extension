import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, ButtonLink, Text } from '../../../../../component-library';
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
  getSendAnalyticProperties,
} from '../../../../../../ducks/send';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SECOND } from '../../../../../../../shared/constants/time';
import { Quote } from '../../../../../../ducks/send/swap-and-send-utils';
import Tooltip from '../../../../../ui/tooltip';
import InfoTooltipIcon from '../../../../../ui/info-tooltip/info-tooltip-icon';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../../shared/constants/metametrics';
import {
  CONSENSYS_TERMS_OF_USE,
  GAS_FEES_LEARN_MORE_URL,
} from '../../../../../../../shared/lib/ui-utils';
import { MetaMetricsContext } from '../../../../../../contexts/metametrics';
import { hexToDecimal } from '../../../../../../../shared/modules/conversion.utils';
import useEthFeeData from './hooks/useEthFeeData';
import useTranslatedNetworkName from './hooks/useTranslatedNetworkName';
import useGetConversionRate from './hooks/useGetConversionRate';

type QuoteCardProps = {
  scrollRef: React.RefObject<HTMLDivElement>;
};

// update literal below if over 60 seconds
const REFRESH_INTERVAL = 30;

/**
 * All the info about the current quote; handles polling and displaying the best quote
 *
 * @param options0
 * @param options0.scrollRef - ref to scroll to quote on quote load
 */
export function QuoteCard({ scrollRef }: QuoteCardProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const sendAnalytics = useSelector(getSendAnalyticProperties);

  const translatedNetworkName = useTranslatedNetworkName();
  const trackEvent = useContext(MetaMetricsContext);

  const { isSwapQuoteLoading } = useSelector(getCurrentDraftTransaction);

  const bestQuote: Quote | undefined = useSelector(getBestQuote);

  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);

  const { formattedEthGasFee, formattedFiatGasFee } = useEthFeeData(
    (bestQuote?.gasParams.maxGas || 0) +
      Number(hexToDecimal(bestQuote?.approvalNeeded?.gas || '0x0')),
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
        block: 'start',
      });
    }

    if (bestQuote) {
      trackEvent(
        {
          event: MetaMetricsEventName.sendSwapQuoteFetched,
          category: MetaMetricsEventCategory.Send,
          properties: {
            is_first_fetch: isQuoteJustLoaded,
          },
          sensitiveProperties: {
            ...sendAnalytics,
          },
        },
        { excludeMetaMetricsId: false },
      );
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
      const timeLeftFormatted = `0${timeLeft}`.slice(-2);
      return timeLeft
        ? t('swapNewQuoteIn', [`0:${timeLeftFormatted}`])
        : undefined;
    }
    return undefined;
  }, [isSwapQuoteLoading, bestQuote, timeLeft]);

  const isContent = Boolean(infoText || bestQuote);

  if (!isContent) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
      gap={2}
    >
      {/* TIMER/FETCH INFO */}
      {infoText && (
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodySm}
          className="quote-card__fetch-status"
        >
          {infoText}
        </Text>
      )}
      {/* QUOTE CARD */}
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
            <Text
              marginLeft={'auto'}
              variant={TextVariant.bodySm}
              data-testid="quote-card__conversion-rate"
            >
              {formattedConversionRate}
            </Text>
          </Box>
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Box
              display={Display.Flex}
              marginRight={'auto'}
              gap={1}
              alignItems={AlignItems.center}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('transactionDetailGasHeading')}
              </Text>
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
            </Box>
            <Box display={Display.Flex} marginLeft={'auto'}>
              <Text
                variant={TextVariant.bodySm}
                data-testid="quote-card__gas-fee"
              >
                {formattedEthGasFee}
              </Text>
              {formattedFiatGasFee && (
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySm}
                  marginLeft={1}
                  data-testid="quote-card__fiat-gas-fee"
                >
                  ≈ {formattedFiatGasFee}
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      )}
      {/* FEE INFO */}
      {bestQuote && (
        <Text color={TextColor.textAlternative} variant={TextVariant.bodySm}>
          {t('swapIncludesMMFeeAlt', [bestQuote?.fee])}
        </Text>
      )}
      {/* TOS LINK; doubles as anchor for scroll ref */}
      {bestQuote && (
        <ButtonLink
          variant={TextVariant.bodySm}
          href={CONSENSYS_TERMS_OF_USE}
          target="_blank"
          className="quote-card__TOS"
        >
          {t('termsOfService')}
        </ButtonLink>
      )}
      {/* SCROLL REF ANCHOR */}
      <div ref={scrollRef} />
    </Box>
  );
}
