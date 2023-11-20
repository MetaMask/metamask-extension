import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { getTokenList } from '../../../selectors';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../multichain';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';

export default function TokenCell({ address, image, symbol, string, onClick }) {
  const tokenList = useSelector(getTokenList);
  const tokenData = Object.values(tokenList).find(
    (token) =>
      token.symbol === symbol && isEqualCaseInsensitive(token.address, address),
  );
  const title = tokenData?.name || symbol;
  const tokenImage = tokenData?.iconUrl || image;
  const formattedFiat = useTokenFiatAmount(address, string, symbol);

  return (
    <TokenListItem
      onClick={() => onClick(address)}
      tokenSymbol={symbol}
      tokenImage={tokenImage}
      primary={`${string || 0}`}
      secondary={formattedFiat}
      title={title}
    />
  );
}

TokenCell.propTypes = {
  address: PropTypes.string,
  symbol: PropTypes.string,
  string: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  image: PropTypes.string,
};
