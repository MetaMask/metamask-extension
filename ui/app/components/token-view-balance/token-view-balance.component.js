import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../button'
import Identicon from '../identicon'
import TokenBalance from '../token-balance'
import CurrencyDisplay from '../currency-display'
import { SEND_ROUTE } from '../../routes'
import { ETH } from '../../constants/common'

export default class TokenViewBalance extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    showDepositModal: PropTypes.func,
    selectedToken: PropTypes.object,
    history: PropTypes.object,
    network: PropTypes.string,
    balance: PropTypes.string,
  }

  renderBalance () {
    const { selectedToken, balance } = this.props

    return selectedToken
      ? (
        <TokenBalance
          token={selectedToken}
          withSymbol
          className="token-view-balance__token-balance"
        />
      ) : (
        <div className="token-view-balance__balance">
          <CurrencyDisplay
            className="token-view-balance__primary-balance"
            value={balance}
            currency={ETH}
            numberOfDecimals={3}
          />
          <CurrencyDisplay
            className="token-view-balance__secondary-balance"
            value={balance}
          />
        </div>
      )
  }

  renderButtons () {
    const { t } = this.context
    const { selectedToken, showDepositModal, history } = this.props

    return (
      <div className="token-view-balance__buttons">
        {
          !selectedToken && (
            <Button
              type="primary"
              className="token-view-balance__button"
              onClick={() => showDepositModal()}
            >
              { t('deposit') }
            </Button>
          )
        }
        <Button
          type="primary"
          className="token-view-balance__button"
          onClick={() => history.push(SEND_ROUTE)}
        >
          { t('send') }
        </Button>
      </div>
    )
  }

  render () {
    const { network, selectedToken } = this.props

    return (
      <div className="token-view-balance">
        <div className="token-view-balance__balance-container">
          <Identicon
            diameter={50}
            address={selectedToken && selectedToken.address}
            network={network}
          />
          { this.renderBalance() }
        </div>
        { this.renderButtons() }
      </div>
    )
  }
}
