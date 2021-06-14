import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import AssetListItem from '../asset-list-item';
import {
  getSelectedAddress,
  getPreferences,
  getCurrentCurrency,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';

export default function TokenCell({
  address,
  decimals,
  balanceError,
  symbol,
  string,
  image,
  onClick,
}) {
  const userAddress = useSelector(getSelectedAddress);
  const t = useI18nContext();
  const currentCurrency = useSelector(getCurrentCurrency).toUpperCase();

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const formattedFiat = useTokenFiatAmount(address, string, symbol, {}, true);
  const useNativeCurrencyAsPrimaryDisplay = useNativeCurrencyAsPrimaryCurrency || string === '0';

  const primary = useNativeCurrencyAsPrimaryDisplay
    ? `${string || 0}`
    : formattedFiat;

  const secondary = useNativeCurrencyAsPrimaryDisplay
    ? formattedFiat
    : `${string || 0}`;

  const primarySymbol = useNativeCurrencyAsPrimaryDisplay
    ? symbol
    : currentCurrency;

  const secondarySymbol = useNativeCurrencyAsPrimaryDisplay
    ? currentCurrency
    : symbol;

  const warning = balanceError ? (
    <span>
      {t('troubleTokenBalances')}
      <a
        href={`https://ethplorer.io/address/${userAddress}`}
        rel="noopener noreferrer"
        target="_blank"
        onClick={(event) => event.stopPropagation()}
        style={{ color: '#F7861C' }}
      >
        {t('here')}
      </a>
    </span>
  ) : null;

  return (
    <AssetListItem
      className={classnames('token-cell', {
        'token-cell--outdated': Boolean(balanceError),
      })}
      iconClassName="token-cell__icon"
      onClick={onClick.bind(null, address)}
      tokenAddress={address}
      tokenImage={image}
      tokenDecimals={decimals}
      warning={warning}
      // if primary is null we move secondary to primary and don't show secondary
      primary={primary || secondary}
      primarySymbol={primarySymbol}
      secondary={primary ? secondary : null}
      secondarySymbol={secondarySymbol}
      primaryIsFiat={!useNativeCurrencyAsPrimaryDisplay}
    />
  );
}

TokenCell.propTypes = {
  address: PropTypes.string,
  balanceError: PropTypes.object,
  symbol: PropTypes.string,
  decimals: PropTypes.number,
  string: PropTypes.string,
  image: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

TokenCell.defaultProps = {
  balanceError: null,
};
