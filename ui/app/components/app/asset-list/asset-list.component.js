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
    selectedAccount: undefined,
    selectedTokenAddress: undefined,
  }

  static propTypes = {
    hideSidebar: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    selectedAccount: PropTypes.object,
    selectedTokenAddress: PropTypes.string,
    setSelectedToken: PropTypes.func.isRequired,
    sidebarOpen: PropTypes.bool.isRequired,
    unsetSelectedToken: PropTypes.func.isRequired,
  }

  renderWalletBalance () {
    const {
      hideSidebar,
      selectedTokenAddress,
      selectedAccount,
      sidebarOpen,
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
            selectedTokenAddress && sidebarOpen && hideSidebar()
          }}
        >
          <BalanceComponent
            balanceValue={selectedAccount ? selectedAccount.balance : ''}
          />
        </div>
      </div>
    )
  }

  renderAddToken () {
    const {
      hideSidebar,
      history,
      sidebarOpen,
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
          if (sidebarOpen) {
            hideSidebar()
          }
        }}
      />
    )
  }

  render () {
    const {
      hideSidebar,
      selectedTokenAddress,
      setSelectedToken,
      sidebarOpen,
    } = this.props
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
            selectedTokenAddress !== tokenAddress && sidebarOpen && hideSidebar()
          }}
        />
        {this.renderAddToken()}
      </>
    )
  }
}
