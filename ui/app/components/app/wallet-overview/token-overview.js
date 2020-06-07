import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import Button from '../../ui/button'
import Identicon from '../../ui/identicon'
import TokenBalance from '../../ui/token-balance'
import { I18nContext } from '../../../contexts/i18n'
import WalletOverview from './wallet-overview'
import { SEND_ROUTE } from '../../../helpers/constants/routes'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import { getAssetImages } from '../../../selectors/selectors'
import { updateSendToken } from '../../../store/actions'

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
  const history = useHistory()
  const assetImages = useSelector(getAssetImages)

  return (
    <WalletOverview
      balance={(
        <div className="token-overview__balance">
          <TokenBalance
            className="token-overview__primary-balance"
            token={token}
          />
        </div>
      )}
      buttons={(
        <Button
          type="secondary"
          className="token-overview__button"
          onClick={() => {
            sendTokenEvent()
            dispatch(updateSendToken(token))
            history.push(SEND_ROUTE)
          }}
        >
          { t('send') }
        </Button>
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
