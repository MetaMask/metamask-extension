import classnames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { conversionUtil, multiplyCurrencies } from '../../../helpers/utils/conversion-util'
import Tooltip from '../../ui/tooltip-v2'
import AssetListItem from '../asset-list-item'
import { useSelector } from 'react-redux'
import { getTokenExchangeRates, getConversionRate, getCurrentCurrency, getSelectedAddress } from '../../../selectors'
import { useI18nContext } from '../../../hooks/useI18nContext'
import InfoIcon from '../../ui/icon/info-icon.component'
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util'

export default function TokenCell ({ address, outdatedBalance, symbol, string, image, onClick }) {
  const contractExchangeRates = useSelector(getTokenExchangeRates)
  const conversionRate = useSelector(getConversionRate)
  const currentCurrency = useSelector(getCurrentCurrency)
  const userAddress = useSelector(getSelectedAddress)
  const t = useI18nContext()

  let currentTokenToFiatRate
  let currentTokenInFiat
  let formattedFiat = ''


  // if the conversionRate is 0 eg: currently unknown
  // or the contract exchange rate is currently unknown
  // the effective currentTokenToFiatRate is 0 and erroneous.
  // Skipping this entire block will result in fiat not being
  // shown to the user, instead of a fiat value of 0 for a non-zero
  // token amount.
  if (conversionRate > 0 && contractExchangeRates[address]) {
    currentTokenToFiatRate = multiplyCurrencies(
      contractExchangeRates[address],
      conversionRate
    )
    currentTokenInFiat = conversionUtil(string, {
      fromNumericBase: 'dec',
      fromCurrency: symbol,
      toCurrency: currentCurrency.toUpperCase(),
      numberOfDecimals: 2,
      conversionRate: currentTokenToFiatRate,
    })
    formattedFiat = `${formatCurrency(currentTokenInFiat, currentCurrency)} ${currentCurrency.toUpperCase()}`
  }

  const showFiat = Boolean(currentTokenInFiat) && currentCurrency.toUpperCase() !== symbol

  const warning = outdatedBalance
    ? (
      <Tooltip
        interactive
        position="bottom"
        html={(
          <div className="token-cell__outdated-tooltip">
            { t('troubleTokenBalances') }
            <a
              href={`https://ethplorer.io/address/${userAddress}`}
              rel="noopener noreferrer"
              target="_blank"
              style={{ color: '#F7861C' }}
            >
              { t('here') }
            </a>
          </div>
        )}
      >
        <InfoIcon severity="warning" />
      </Tooltip>
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
      secondary={showFiat ? formattedFiat : undefined}
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
