import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import BalanceComponent from '../../ui/balance'
import AddTokenButton from '../add-token-button'
import TokenList from '../token-list'
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes'

export default class AssetList extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    selectedTokenAddress: undefined,
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    selectedTokenAddress: PropTypes.string,
    setSelectedToken: PropTypes.func.isRequired,
    unsetSelectedToken: PropTypes.func.isRequired,
  }

  renderWalletBalance () {
    const {
      selectedTokenAddress,
      unsetSelectedToken,
    } = this.props

    return (
      <div
        className={classnames('flex-column', 'wallet-balance-wrapper', {
          'wallet-balance-wrapper--active': !selectedTokenAddress,
        })}
      >
        <div
          className="wallet-balance"
          onClick={() => {
            unsetSelectedToken()
          }}
        >
          <BalanceComponent />
        </div>
      </div>
    )
  }

  renderAddToken () {
    const {
      history,
    } = this.props
    const { metricsEvent } = this.context

    return (
      <AddTokenButton
        onClick={() => {
          history.push(ADD_TOKEN_ROUTE)
          metricsEvent({
            eventOpts: {
              category: 'Navigation',
              action: 'Token Menu',
              name: 'Clicked "Add Token"',
            },
          })
        }}
      />
    )
  }

  render () {
    const { setSelectedToken } = this.props
    return (
      <>
        {this.renderWalletBalance()}
        <TokenList
          onTokenClick={(tokenAddress) => {
            setSelectedToken(tokenAddress)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Token Menu',
                name: 'Clicked Token',
              },
            })
          }}
        />
        {this.renderAddToken()}
      </>
    )
  }
}
