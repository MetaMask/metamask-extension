import React, { useContext, useEffect, useMemo, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import {
  getCurrentDraftTransaction,
  getBestQuote,
  updateSendQuote,
} from '../../../../../../ducks/send';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SECOND } from '../../../../../../../shared/constants/time';
import ExchangeRateDisplay from '../../../../../../pages/swaps/exchange-rate-display';
import { Quote } from '../../../../../../ducks/send/swap-and-send-utils';
import { getNativeCurrency } from '../../../../../../ducks/metamask/metamask';
import { AssetType } from '../../../../../../../shared/constants/transaction';
import useEthFeeData from './hooks/useEthFeeData';
import Tooltip from '../../../../../ui/tooltip';
import InfoTooltipIcon from '../../../../../ui/info-tooltip/info-tooltip-icon';
import useTranslatedNetworkName from './hooks/useTranslatedNetworkName';
import { MetaMetricsEventCategory } from '../../../../../../../shared/constants/metametrics';
import { GAS_FEES_LEARN_MORE_URL } from '../../../../../../pages/swaps/prepare-swap-page/review-quote';
import { MetaMetricsContext } from '../../../../../../contexts/metametrics';

const REFRESH_INTERVAL = 30;
const NATIVE_CURRENCY_DECIMALS = 18;

/**
 * All the info about the current quote; handles polling and displaying the best quote
 * @returns
 */
export function QuoteCard() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const translatedNetworkName = useTranslatedNetworkName();
  const trackEvent = useContext(MetaMetricsContext);

  const { isSwapQuoteLoading, sendAsset, receiveAsset } = useSelector(
    getCurrentDraftTransaction,
  );
  const nativeCurrencySymbol = useSelector(getNativeCurrency);

  const bestQuote: Quote | undefined = useSelector(getBestQuote);

  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);

  const sourceTokenSymbol =
    sendAsset.type === AssetType.native
      ? nativeCurrencySymbol
      : sendAsset.details?.symbol;

  const destinationTokenSymbol =
    receiveAsset.type === AssetType.native
      ? nativeCurrencySymbol
      : receiveAsset.details?.symbol;

  const { formattedEthGasFee, formattedFiatGasFee } = useEthFeeData(
    bestQuote?.gasParams.maxGas,
  );

  useEffect(() => {
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
      dispatch(updateSendQuote());
    }

    const timeout = setTimeout(() => setTimeLeft(timeLeft - 1), SECOND);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  let infoText = useMemo(() => {
    if (isSwapQuoteLoading) {
      return t('swapFetchingQuotes');
    } else if (bestQuote) {
      return timeLeft ? t('swapNewQuoteIn', [timeLeft]) : undefined;
    }
    return undefined;
  }, [isSwapQuoteLoading, bestQuote, timeLeft]);

  return (
    <Box
      display={Display.Flex}
      paddingBottom={4}
      flexDirection={FlexDirection.Column}
      alignItems={isSwapQuoteLoading ? AlignItems.center : AlignItems.flexStart}
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
          className="quote-card__quote-info"
        >
          <Box display={Display.Flex} alignItems={AlignItems.stretch}>
            <Text color={TextColor.textAlternative} marginRight={'auto'}>
              {t('quoteRate')}
            </Text>
            <Text marginLeft={'auto'}>
              <ExchangeRateDisplay
                primaryTokenValue={bestQuote.sourceAmount}
                primaryTokenDecimals={
                  sendAsset.details?.decimals || NATIVE_CURRENCY_DECIMALS
                }
                primaryTokenSymbol={sourceTokenSymbol}
                secondaryTokenValue={bestQuote.destinationAmount}
                secondaryTokenDecimals={
                  receiveAsset.details?.decimals || NATIVE_CURRENCY_DECIMALS
                }
                secondaryTokenSymbol={destinationTokenSymbol}
                boldSymbols={false}
                showIconForSwappingTokens={false}
                className={'quote-card__quote-info'}
              />
            </Text>
          </Box>
          <Box display={Display.Flex} alignItems={AlignItems.stretch}>
            <Text
              display={Display.Flex}
              color={TextColor.textAlternative}
              marginRight={'auto'}
              gap={1}
              alignItems={AlignItems.center}
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
              <Text>{formattedEthGasFee}</Text>
              {formattedFiatGasFee && (
                <Text color={TextColor.textAlternative} marginLeft={1}>
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
