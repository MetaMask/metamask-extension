import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'
import { useHistory } from 'react-router-dom'

import Identicon from '../../ui/identicon'
import { I18nContext } from '../../../contexts/i18n'
import { SEND_ROUTE, BUILD_QUOTE_ROUTE } from '../../../helpers/constants/routes'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import Tooltip from '../../ui/tooltip'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'
import { showModal } from '../../../store/actions'
import { isBalanceCached, getSelectedAccount, getShouldShowFiat, getCurrentNetworkId } from '../../../selectors/selectors'
import { getValueFromWeiHex } from '../../../helpers/utils/conversions.util'
import SwapIcon from '../../ui/icon/swap-icon.component'
import BuyIcon from '../../ui/icon/overview-buy-icon.component'
import SendIcon from '../../ui/icon/overview-send-icon.component'
import { setSwapsFromToken } from '../../../ducks/swaps/swaps'
import { ETH_SWAPS_TOKEN_OBJECT } from '../../../helpers/constants/swaps'
import WalletOverview from './wallet-overview'

const EthOverview = ({ className, setSwapToken }) => {
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
  const convertEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Convert: eth',
    },
  })
  const history = useHistory()
  const balanceIsCached = useSelector(isBalanceCached)
  const showFiat = useSelector(getShouldShowFiat)
  const selectedAccount = useSelector(getSelectedAccount)
  const { balance } = selectedAccount
  const networkId = useSelector(getCurrentNetworkId)
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
                data-testid="eth-overview__primary-currency"
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
                  data-testid="eth-overview__secondary-currency"
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
          <div className="eth-overview__button">
            <div
              className="eth-overview__circle"
              onClick={() => {
                depositEvent()
                dispatch(showModal({ name: 'DEPOSIT_ETHER' }))
              }}
            >
              <BuyIcon />
            </div>
            { t('buy') }
          </div>
          <div className="eth-overview__button">
            <div
              className="eth-overview__circle"
              onClick={() => {
                sendEvent()
                history.push(SEND_ROUTE)
              }}
              data-testid="eth-overview-send"
            >
              <SendIcon />
            </div>
            { t('send') }
          </div>
          <div
            className={classnames('eth-overview__button', {
              'eth-overview__button--disabled': networkId !== '1',
            })}
          >
            <Tooltip title={t('onlyAvailableOnMainnet')} position="bottom" disabled={networkId === '1'}>
              <>
                <div
                  className="eth-overview__circle"
                  onClick={() => {
                    if (networkId === '1') {
                      convertEvent()
                      setSwapToken && dispatch(setSwapsFromToken({
                        ...ETH_SWAPS_TOKEN_OBJECT,
                        balance,
                        string: getValueFromWeiHex({ value: balance, numberOfDecimals: 4, toDenomination: 'ETH' }),
                      }))
                      history.push(BUILD_QUOTE_ROUTE)
                    }
                  }}
                >
                  <SwapIcon />
                </div>
                { t('swap') }
              </>
            </Tooltip>
          </div>
        </>
      )}
      className={className}
      icon={<Identicon diameter={32} />}
    />
  )
}

EthOverview.propTypes = {
  className: PropTypes.string,
  setSwapToken: PropTypes.bool,
}

EthOverview.defaultProps = {
  className: undefined,
}

export default EthOverview
