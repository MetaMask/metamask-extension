import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../button'
import Identicon from '../identicon'
import TokenBalance from '../token-balance'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import { SEND_ROUTE } from '../../routes'
import { PRIMARY, SECONDARY } from '../../constants/common'

export default class TransactionViewBalance extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    showDepositModal: PropTypes.func,
    selectedToken: PropTypes.object,
    history: PropTypes.object,
    network: PropTypes.string,
    balance: PropTypes.string,
    assetImage: PropTypes.string,
  }

  renderBalance () {
    const { selectedToken, balance } = this.props

    return selectedToken
      ? (
        <div className="transaction-view-balance__balance">
          <TokenBalance
            token={selectedToken}
            withSymbol
            className="transaction-view-balance__primary-balance"
          />
        </div>
      ) : (
        <div className="transaction-view-balance__balance">
          <UserPreferencedCurrencyDisplay
            className="transaction-view-balance__primary-balance"
            value={balance}
            type={PRIMARY}
            ethNumberOfDecimals={4}
          />
          <UserPreferencedCurrencyDisplay
            className="transaction-view-balance__secondary-balance"
            value={balance}
            type={SECONDARY}
            ethNumberOfDecimals={4}
          />
        </div>
      )
  }

  renderButtons () {
    const { t } = this.context
    const { selectedToken, showDepositModal, history } = this.props

    return (
      <div className="transaction-view-balance__buttons">
        {
          !selectedToken && (
            <Button
              type="primary"
              className="transaction-view-balance__button"
              onClick={() => showDepositModal()}
            >
              { t('deposit') }
            </Button>
          )
        }
        <Button
          type="primary"
          className="transaction-view-balance__button"
          onClick={() => history.push(SEND_ROUTE)}
        >
          { t('send') }
        </Button>
      </div>
    )
  }

  render () {
    const { network, selectedToken, assetImage } = this.props

    return (
      <div className="transaction-view-balance">
        <div className="transaction-view-balance__balance-container">
          <Identicon
            diameter={50}
            address={selectedToken && selectedToken.address}
            network={network}
            image={assetImage}
          />
          { this.renderBalance() }
        </div>
        { this.renderButtons() }
      </div>
    )
  }
}
