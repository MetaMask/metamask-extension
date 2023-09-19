import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import Box from '../../../components/ui/box';
import {
  DISPLAY,
  AlignItems,
  SEVERITIES,
  TextVariant,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';
import { GasRecommendations } from '../../../../shared/constants/gas';
import {
  BannerAlert,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../components/component-library';

export default function ViewQuotePriceDifference(props) {
  const {
    usedQuote,
    sourceTokenValue,
    destinationTokenValue,
    onAcknowledgementClick,
    acknowledged,
    priceSlippageFromSource,
    priceSlippageFromDestination,
    priceDifferencePercentage,
    priceSlippageUnknownFiatValue,
  } = props;

  const t = useContext(I18nContext);

  let priceDifferenceTitle = t('swapPriceUnavailableTitle');
  let priceDifferenceMessage = t('swapPriceUnavailableDescription');
  let priceDifferenceClass = GasRecommendations.high;
  if (!priceSlippageUnknownFiatValue) {
    priceDifferenceTitle = t('swapPriceDifferenceTitle', [
      priceDifferencePercentage,
    ]);
    priceDifferenceMessage = t('swapPriceDifference', [
      sourceTokenValue, // Number of source token to swap
      usedQuote.sourceTokenInfo.symbol, // Source token symbol
      priceSlippageFromSource, // Source tokens total value
      destinationTokenValue, // Number of destination tokens in return
      usedQuote.destinationTokenInfo.symbol, // Destination token symbol,
      priceSlippageFromDestination, // Destination tokens total value
    ]);
    priceDifferenceClass = usedQuote.priceSlippage.bucket;
  }
  const severity =
    priceDifferenceClass === GasRecommendations.high
      ? SEVERITIES.DANGER
      : SEVERITIES.WARNING;

  return (
    <Box display={DISPLAY.FLEX} marginTop={2}>
      <BannerAlert
        title={priceDifferenceTitle}
        titleProps={{ 'data-testid': 'swaps-banner-title' }}
        severity={severity}
        width={BLOCK_SIZES.FULL}
        data-testid="mm-banner-alert"
      >
        <Box>
          <Text
            variant={TextVariant.bodyMd}
            as="h6"
            data-testid="mm-banner-alert-notification-text"
          >
            {priceDifferenceMessage}
          </Text>
          {!acknowledged && (
            <ButtonLink
              size={ButtonLinkSize.Inherit}
              textProps={{
                variant: TextVariant.bodyMd,
                alignItems: AlignItems.flexStart,
              }}
              onClick={onAcknowledgementClick}
            >
              {t('swapAnyway')}
            </ButtonLink>
          )}
        </Box>
      </BannerAlert>
    </Box>
  );
}

ViewQuotePriceDifference.propTypes = {
  usedQuote: PropTypes.object,
  sourceTokenValue: PropTypes.string,
  destinationTokenValue: PropTypes.string,
  onAcknowledgementClick: PropTypes.func,
  acknowledged: PropTypes.bool,
  priceSlippageFromSource: PropTypes.string,
  priceSlippageFromDestination: PropTypes.string,
  priceDifferencePercentage: PropTypes.number,
  priceSlippageUnknownFiatValue: PropTypes.bool,
};
