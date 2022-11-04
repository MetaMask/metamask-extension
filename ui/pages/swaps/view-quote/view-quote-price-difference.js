import React, { useContext } from 'react';

import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';

import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import Tooltip from '../../../components/ui/tooltip';
import Box from '../../../components/ui/box';
import {
  JUSTIFY_CONTENT,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import { GAS_RECOMMENDATIONS } from '../../../../shared/constants/gas';

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

  let priceDifferenceTitle = '';
  let priceDifferenceMessage = '';
  let priceDifferenceClass = '';
  let priceDifferenceAcknowledgementText = '';
  if (priceSlippageUnknownFiatValue) {
    // A calculation error signals we cannot determine dollar value
    priceDifferenceTitle = t('swapPriceUnavailableTitle');
    priceDifferenceMessage = t('swapPriceUnavailableDescription');
    priceDifferenceClass = GAS_RECOMMENDATIONS.HIGH;
    priceDifferenceAcknowledgementText = t('tooltipApproveButton');
  } else {
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
    priceDifferenceAcknowledgementText = t('tooltipApproveButton');
  }

  return (
    <div
      className={classnames(
        'view-quote__price-difference-warning-wrapper',
        priceDifferenceClass,
      )}
    >
      <ActionableMessage
        message={
          <div className="view-quote__price-difference-warning-contents">
            <div className="view-quote__price-difference-warning-contents-text">
              <Box
                display={DISPLAY.FLEX}
                justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
                paddingBottom={2}
              >
                <div className="view-quote__price-difference-warning-contents-title">
                  {priceDifferenceTitle}
                </div>
                <Tooltip position="bottom" title={t('swapPriceImpactTooltip')}>
                  <i className="fa fa-info-circle" />
                </Tooltip>
              </Box>
              {priceDifferenceMessage}
              {!acknowledged && (
                <div className="view-quote__price-difference-warning-contents-actions">
                  <button
                    onClick={() => {
                      onAcknowledgementClick();
                    }}
                  >
                    {priceDifferenceAcknowledgementText}
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />
    </div>
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
