import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import classnames from 'classnames';
import { formatSwapsValueForDisplay } from '../swaps.util';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import Box from '../../../components/ui/box';
import {
  JustifyContent,
  DISPLAY,
  AlignItems,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Icon, IconName } from '../../../components/component-library';
import { I18nContext } from '../../../contexts/i18n';

export default function ExchangeRateDisplay({
  primaryTokenValue,
  primaryTokenDecimals = 18,
  primaryTokenSymbol,
  secondaryTokenValue,
  secondaryTokenDecimals = 18,
  secondaryTokenSymbol,
  boldSymbols = true,
  showIconForSwappingTokens = true,
  className,
  onQuotesClick,
}) {
  const [showPrimaryToSecondary, setShowPrimaryToSecondary] = useState(true);
  const t = useContext(I18nContext);

  const primaryTokenAmount = calcTokenAmount(
    primaryTokenValue,
    primaryTokenDecimals,
  );
  const secondaryTokenAmount = calcTokenAmount(
    secondaryTokenValue,
    secondaryTokenDecimals,
  );

  const conversionRateFromPrimaryToSecondary = new BigNumber(
    secondaryTokenAmount,
  )
    .div(primaryTokenAmount)
    .round(9)
    .toString(10);
  const conversionRateFromSecondaryToPrimary = new BigNumber(primaryTokenAmount)
    .div(secondaryTokenAmount)
    .round(9)
    .toString(10);

  const baseSymbol = showPrimaryToSecondary
    ? primaryTokenSymbol
    : secondaryTokenSymbol;
  const ratiodSymbol = showPrimaryToSecondary
    ? secondaryTokenSymbol
    : primaryTokenSymbol;

  const rate = showPrimaryToSecondary
    ? conversionRateFromPrimaryToSecondary
    : conversionRateFromSecondaryToPrimary;
  let rateToDisplay;
  let comparisonSymbol = '=';

  if (new BigNumber(rate, 10).lt('0.00000001', 10)) {
    rateToDisplay = '0.000000001';
    comparisonSymbol = '<';
  } else if (new BigNumber(rate, 10).lt('0.000001', 10)) {
    rateToDisplay = rate;
  } else {
    rateToDisplay = formatSwapsValueForDisplay(rate);
  }

  const quoteRateClassName = onQuotesClick
    ? 'exchange-rate-display__quote-rate'
    : 'exchange-rate-display__quote-rate--no-link';
  const quoteRateColor = onQuotesClick
    ? TextColor.primaryDefault
    : TextColor.textDefault;

  return (
    <div className={classnames('exchange-rate-display', className)}>
      <Box
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        onClick={onQuotesClick}
        color={quoteRateColor}
        className={quoteRateClassName}
        data-testid="exchange-rate-display-quote-rate"
      >
        <span>1</span>
        <span
          className={classnames({ 'exchange-rate-display__bold': boldSymbols })}
          data-testid="exchange-rate-display-base-symbol"
        >
          {baseSymbol}
        </span>
        <span>{comparisonSymbol}</span>
        <span>{rateToDisplay}</span>
        <span
          className={classnames({ 'exchange-rate-display__bold': boldSymbols })}
        >
          {ratiodSymbol}
        </span>
      </Box>
      {showIconForSwappingTokens && (
        <Icon
          name={IconName.SwapHorizontal}
          onClick={() => {
            setShowPrimaryToSecondary(!showPrimaryToSecondary);
          }}
          color={IconColor.iconAlternative}
          style={{ cursor: 'pointer' }}
          title={t('switch')}
          data-testid="exchange-rate-display-switch"
        />
      )}
    </div>
  );
}

ExchangeRateDisplay.propTypes = {
  primaryTokenValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  primaryTokenDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  primaryTokenSymbol: PropTypes.string.isRequired,
  secondaryTokenValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  secondaryTokenDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  secondaryTokenSymbol: PropTypes.string.isRequired,
  className: PropTypes.string,
  boldSymbols: PropTypes.bool,
  showIconForSwappingTokens: PropTypes.bool,
  onQuotesClick: PropTypes.func,
};
