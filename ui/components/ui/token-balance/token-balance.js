import React from 'react';
import PropTypes from 'prop-types';
import CurrencyDisplay from '../currency-display';
import { useTokenTracker } from '../../../hooks/useTokenTracker';

export default function TokenBalance({ className, token, ...restProps }) {
  const { tokensWithBalances } = useTokenTracker({ tokens: [token] });

  const { string, symbol } = tokensWithBalances[0] || {};
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
};

TokenBalance.defaultProps = {
  className: undefined,
};
