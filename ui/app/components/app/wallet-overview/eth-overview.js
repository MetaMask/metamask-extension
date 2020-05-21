import React, { useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'
import { useHistory } from 'react-router-dom'

import Button from '../../ui/button'
import Identicon from '../../ui/identicon'
import { I18nContext } from '../../../contexts/i18n'
import WalletOverview from './wallet-overview'
import { SEND_ROUTE } from '../../../helpers/constants/routes'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import Tooltip from '../../ui/tooltip-v2'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'
import { showModal } from '../../../store/actions'
import { isBalanceCached, getSelectedAccount, getShouldShowFiat } from '../../../selectors/selectors'

const EthOverview = () => {
  const dispatch = useDispatch()
  const t = useContext(I18nContext)
  const sendEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Send: Eth',
    },
  })
  const depositEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Deposit',
    },
  })
  const history = useHistory()
  const balanceIsCached = useSelector(isBalanceCached)
  const showFiat = useSelector(getShouldShowFiat)
  const selectedAccount = useSelector(getSelectedAccount)
  const { balance } = selectedAccount

  return (
    <WalletOverview
      balance={(
        <Tooltip position="top" title={t('balanceOutdated')} disabled={!balanceIsCached}>
          <div className="eth-overview__balance">
            <div className="eth-overview__primary-container">
              <UserPreferencedCurrencyDisplay
                className={classnames('eth-overview__primary-balance', {
                  'eth-overview__cached-balance': balanceIsCached,
                })}
                value={balance}
                type={PRIMARY}
                ethNumberOfDecimals={4}
                hideTitle
              />
              {
                balanceIsCached ? <span className="eth-overview__cached-star">*</span> : null
              }
            </div>
            {
              showFiat && (
                <UserPreferencedCurrencyDisplay
                  className={classnames({
                    'eth-overview__cached-secondary-balance': balanceIsCached,
                    'eth-overview__secondary-balance': !balanceIsCached,
                  })}
                  value={balance}
                  type={SECONDARY}
                  ethNumberOfDecimals={4}
                  hideTitle
                />
              )
            }
          </div>
        </Tooltip>
      )}
      buttons={(
        <>
          <Button
            type="secondary"
            className="eth-overview__button"
            onClick={() => {
              depositEvent()
              dispatch(showModal({ name: 'DEPOSIT_ETHER' }))
            }}
          >
            { t('deposit') }
          </Button>
          <Button
            type="secondary"
            className="eth-overview__button"
            onClick={() => {
              sendEvent()
              history.push(SEND_ROUTE)
            }}
            data-testid="eth-overview-send"
          >
            { t('send') }
          </Button>
        </>
      )}
      icon={<Identicon diameter={50} />}
    />
  )
}

EthOverview.propTypes = {

}

export default EthOverview
