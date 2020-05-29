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
import { updateSend } from '../../../store/actions'

const TokenOverview = ({ token }) => {
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
            token={token}
            withSymbol
            className="token-overview__primary-balance"
          />
        </div>
      )}
      buttons={(
        <Button
          type="secondary"
          className="token-overview__button"
          onClick={() => {
            sendTokenEvent()
            dispatch(updateSend({ token }))
            history.push(SEND_ROUTE)
          }}
        >
          { t('send') }
        </Button>
      )}
      icon={(
        <Identicon
          diameter={50}
          address={token.address}
          image={assetImages[token.address]}
        />
      )}
    />
  )
}

TokenOverview.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
}

export default TokenOverview
