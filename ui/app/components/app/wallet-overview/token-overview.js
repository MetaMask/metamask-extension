import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import Identicon from '../../ui/identicon'
import CurrencyDisplay from '../../ui/currency-display'
import { I18nContext } from '../../../contexts/i18n'
import { SEND_ROUTE, BUILD_QUOTE_ROUTE } from '../../../helpers/constants/routes'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import { useTokenTracker } from '../../../hooks/useTokenTracker'
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount'
import { getAssetImages } from '../../../selectors/selectors'
import { updateSendToken } from '../../../store/actions'

import SwapIcon from '../../ui/icon/swap-icon.component'
import SendIcon from '../../ui/icon/overview-send-icon.component'

import WalletOverview from './wallet-overview'

const TokenOverview = ({ className, token }) => {
  const dispatch = useDispatch()
  const t = useContext(I18nContext)
  const sendTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Send: Token',
    },
  })
  const convertEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Convert: token',
    },
  })
  const history = useHistory()
  const assetImages = useSelector(getAssetImages)
  const { tokensWithBalances } = useTokenTracker([token])
  const balance = tokensWithBalances[0]?.string
  const formattedFiatBalance = useTokenFiatAmount(token.address, balance, token.symbol)

  return (
    <WalletOverview
      balance={(
        <div className="token-overview__balance">
          <CurrencyDisplay
            className="token-overview__primary-balance"
            displayValue={balance}
            suffix={token.symbol}
          />
          {
            formattedFiatBalance
              ? (
                <CurrencyDisplay
                  className="token-overview__secondary-balance"
                  displayValue={formattedFiatBalance}
                  hideLabel
                />
              )
              : null
          }
        </div>
      )}
      buttons={(
        <>
          <div className="eth-overview__button">
            <div
              className="eth-overview__circle"
              onClick={() => {
                sendTokenEvent()
                dispatch(updateSendToken(token))
                history.push(SEND_ROUTE)
              }}
              data-testid="eth-overview-send"
            >
              <SendIcon />
            </div>
            { t('send') }
          </div>
          <div className="eth-overview__button">
            <div
              className="eth-overview__circle"
              onClick={() => {
                convertEvent()
                history.push(BUILD_QUOTE_ROUTE)
              }}
            >
              <SwapIcon />
            </div>
            { t('swap') }
          </div>
        </>
      )}
      className={className}
      icon={(
        <Identicon
          diameter={32}
          address={token.address}
          image={assetImages[token.address]}
        />
      )}
    />
  )
}

TokenOverview.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
}

TokenOverview.defaultProps = {
  className: undefined,
}

export default TokenOverview
