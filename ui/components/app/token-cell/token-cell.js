import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getTokenList,
} from '../../../selectors';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { TokenListItem } from '../../multichain';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';

export default function TokenCell({
  address,
  image,
  symbol,
  string,
  onClick,
  balance,
}) {
  const tokenList = useSelector(getTokenList);
  const tokenData = Object.values(tokenList).find(
    (token) => token.symbol === symbol,
  );
  const title = tokenData?.name || symbol;
  const tokenImage = tokenData?.iconUrl || image;

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(balance, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: symbol,
  });

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(balance, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: symbol,
    });

  const showFiat = useSelector(getShouldShowFiat);

  console.log(primaryCurrencyProperties, symbol);

  // console.log("Token data is: ", tokenData);

  /*
    <TokenListItem
        onClick={() => onClickAsset(nativeCurrency)}
        title={nativeCurrency}
        primary={
          primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
        }
        tokenSymbol={primaryCurrencyProperties.suffix}
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
        tokenImage={balanceIsLoading ? null : primaryTokenImage}
      />
  */

      console.table([
        ['primaryCurrencyProperties', primaryCurrencyProperties],
        ['secondaryCurrencyProperties', secondaryCurrencyProperties],
      ])

  return (
    <TokenListItem
      onClick={() => onClick(address)}
      tokenSymbol={primaryCurrencyProperties.suffix}
      tokenImage={tokenImage}
      primary={
        'here' // primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
      }
      secondary={showFiat ? secondaryCurrencyDisplay : undefined}
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
