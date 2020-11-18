import classnames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { useSelector } from 'react-redux'
import AssetListItem from '../asset-list-item'
import { getSelectedAddress } from '../../../selectors'
import { useI18nContext } from '../../../hooks/useI18nContext'
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount'

export default function TokenCell({
  address,
  decimals,
  outdatedBalance,
  symbol,
  string,
  image,
  onClick,
}) {
  const userAddress = useSelector(getSelectedAddress)
  const t = useI18nContext()

  const formattedFiat = useTokenFiatAmount(address, string, symbol)

  const warning = outdatedBalance ? (
    <span>
      {t('troubleTokenBalances')}
      <a
        href={`https://ethplorer.io/address/${userAddress}`}
        rel="noopener noreferrer"
        target="_blank"
        style={{ color: '#F7861C' }}
      >
        {t('here')}
      </a>
    </span>
  ) : null

  return (
    <AssetListItem
      className={classnames('token-cell', {
        'token-cell--outdated': outdatedBalance,
      })}
      iconClassName="token-cell__icon"
      onClick={onClick.bind(null, address)}
      tokenAddress={address}
      tokenImage={image}
      tokenSymbol={symbol}
      tokenDecimals={decimals}
      warning={warning}
      primary={`${string || 0}`}
      secondary={formattedFiat}
    />
  )
}

TokenCell.propTypes = {
  address: PropTypes.string,
  outdatedBalance: PropTypes.bool,
  symbol: PropTypes.string,
  decimals: PropTypes.number,
  string: PropTypes.string,
  image: PropTypes.string,
  onClick: PropTypes.func.isRequired,
}

TokenCell.defaultProps = {
  outdatedBalance: false,
}
