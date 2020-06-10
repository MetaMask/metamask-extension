import classnames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import AssetListItem from '../asset-list-item'
import { useSelector } from 'react-redux'
import { getSelectedAddress } from '../../../selectors'
import { useI18nContext } from '../../../hooks/useI18nContext'
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount'


export default function TokenCell ({ address, outdatedBalance, symbol, string, image, onClick }) {
  const userAddress = useSelector(getSelectedAddress)
  const t = useI18nContext()

  const formattedFiat = useTokenFiatAmount(address, string, symbol)

  const warning = outdatedBalance
    ? (
      <span>
        { t('troubleTokenBalances') }
        <a
          href={`https://ethplorer.io/address/${userAddress}`}
          rel="noopener noreferrer"
          target="_blank"
          style={{ color: '#F7861C' }}
        >
          { t('here') }
        </a>
      </span>
    )
    : null

  return (
    <AssetListItem
      className={classnames('token-cell', { 'token-cell--outdated': outdatedBalance })}
      iconClassName="token-cell__icon"
      onClick={onClick.bind(null, address)}
      tokenAddress={address}
      tokenImage={image}
      warning={warning}
      primary={`${string || 0} ${symbol}`}
      secondary={formattedFiat}
    />

  )
}

TokenCell.propTypes = {
  address: PropTypes.string,
  outdatedBalance: PropTypes.bool,
  symbol: PropTypes.string,
  string: PropTypes.string,
  image: PropTypes.string,
  onClick: PropTypes.func.isRequired,
}

TokenCell.defaultProps = {
  outdatedBalance: false,
}
