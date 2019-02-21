import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from '../button'
import Identicon from '../identicon'
import TokenBalance from '../token-balance'
import Spinner from '../spinner'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import { SEND_ROUTE } from '../../routes'
import { PRIMARY, SECONDARY } from '../../constants/common'
import Tooltip from '../tooltip-v2'

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
    balanceIsCached: PropTypes.bool,
    networkIsLoading: PropTypes.bool,
  }

  state = {
    hideBalance: false,
    showSpinner: false,
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.networkIsLoading) {
      this.setState({ hideBalance: true, showSpinner: true })
      setTimeout(() => this.setState({
        hideBalance: false,
        showSpinner: false,
      }), 1500)
    }
  }

  renderBalance () {
    const { hideBalance } = this.state
    const { selectedToken, balance, balanceIsCached, networkIsLoading } = this.props

    return selectedToken
      ? (
        <div className={classnames({
          'transaction-view-balance__balance': !hideBalance && !networkIsLoading,
          'transaction-view-balance__balance-hidden': hideBalance || networkIsLoading,
        })}>
          <TokenBalance
            token={selectedToken}
            withSymbol
            className="transaction-view-balance__primary-balance"
          />
        </div>
      ) : (
          <Tooltip position="top" title={this.context.t('balanceOutdated')} disabled={!balanceIsCached}>
            <div className={classnames({
              'transaction-view-balance__balance': !hideBalance && !networkIsLoading,
              'transaction-view-balance__balance-hidden': hideBalance || networkIsLoading,
            })}>
                <div className="transaction-view-balance__primary-container">
                  <UserPreferencedCurrencyDisplay
                    className={classnames('transaction-view-balance__primary-balance', {
                      'transaction-view-balance__cached-balance': balanceIsCached,
                    })}
                    value={balance}
                    type={PRIMARY}
                    ethNumberOfDecimals={4}
                    hideTitle={true}
                  />
                  {
                    balanceIsCached ? <span className="transaction-view-balance__cached-star">*</span> : null
                  }
                </div>
                <UserPreferencedCurrencyDisplay
                  className={classnames({
                    'transaction-view-balance__cached-secondary-balance': balanceIsCached,
                    'transaction-view-balance__secondary-balance': !balanceIsCached,
                  })}
                  value={balance}
                  type={SECONDARY}
                  ethNumberOfDecimals={4}
                  hideTitle={true}
                />
            </div>
          </Tooltip>
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
    const { network, selectedToken, assetImage, networkIsLoading } = this.props
    const { showSpinner } = this.state

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
          { showSpinner || networkIsLoading ? <Spinner color="#CDCDCD" /> : null }
        </div>
        { this.renderButtons() }
      </div>
    )
  }
}
