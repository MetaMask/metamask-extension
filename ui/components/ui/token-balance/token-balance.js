import React from 'react';
import PropTypes from 'prop-types';
import CurrencyDisplay from '../currency-display';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { Text } from '../../component-library';
import {
  FontWeight,
  TextVariant,
} from '../../../helpers/constants/design-system';

export default function TokenBalance({
  className = undefined,
  token,
  showFiat,
  ...restProps
}) {
  const { tokensWithBalances } = useTokenTracker({ tokens: [token] });
  const { string, symbol, address } = tokensWithBalances[0] || {};
  const formattedFiat = useTokenFiatAmount(address, string, symbol);
  if (showFiat) {
    return (
      <Text fontWeight={FontWeight.Medium} variant={TextVariant.bodyMd}>
        {formattedFiat}
      </Text>
    );
  }
  return (
    <CurrencyDisplay
      className={className}
      displayValue={string || ''}
      suffix={symbol || ''}
      {...restProps}
    />
  );
}

TokenBalance.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
  showFiat: PropTypes.bool,
};
