import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import BalanceComponent from '../../ui/balance'
import AddTokenButton from '../add-token-button'
import AccountDetails from '../account-details'

const { checksumAddress } = require('../../../helpers/utils/util')
const TokenList = require('../token-list')
const { ADD_TOKEN_ROUTE, CONNECTED_ROUTE } = require('../../../helpers/constants/routes')

export default class WalletView extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    responsiveDisplayClassname: '',
    selectedAccount: null,
    selectedTokenAddress: null,
  }

  static propTypes = {
    selectedTokenAddress: PropTypes.string,
    selectedAccount: PropTypes.object,
    selectedAddress: PropTypes.string.isRequired,
    keyrings: PropTypes.array.isRequired,
    responsiveDisplayClassname: PropTypes.string,
    identities: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    unsetSelectedToken: PropTypes.func.isRequired,
    sidebarOpen: PropTypes.bool.isRequired,
    hideSidebar: PropTypes.func.isRequired,
  }

  renderWalletBalance () {
    const {
      selectedTokenAddress,
      selectedAccount,
      unsetSelectedToken,
      hideSidebar,
      sidebarOpen,
    } = this.props

    return (
      <div
        className={classnames('flex-column', 'wallet-balance-wrapper', {
          'wallet-balance-wrapper--active': Boolean(selectedTokenAddress),
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
      sidebarOpen,
      hideSidebar,
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
          if (sidebarOpen) {
            hideSidebar()
          }
        }}
      />
    )
  }

  showConnectedSites = () => {
    const {
      sidebarOpen,
      hideSidebar,
      history,
    } = this.props
    history.push(CONNECTED_ROUTE)
    if (sidebarOpen) {
      hideSidebar()
    }
  }

  render () {
    const {
      responsiveDisplayClassname,
      selectedAddress,
      keyrings,
      identities,
    } = this.props

    const checksummedAddress = checksumAddress(selectedAddress)

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(selectedAddress)
    })

    let label = ''
    let type
    if (keyring) {
      type = keyring.type
      if (type !== 'HD Key Tree') {
        if (type.toLowerCase().search('hardware') !== -1) {
          label = this.context.t('hardware')
        } else {
          label = this.context.t('imported')
        }
      }
    }

    return (
      <div className={classnames('wallet-view', 'flex-column', responsiveDisplayClassname)}>
        <AccountDetails
          label={label}
          checksummedAddress={checksummedAddress}
          name={identities[selectedAddress].name}
          showConnectedSites={this.showConnectedSites}
        />
        {this.renderWalletBalance()}
        <TokenList />
        {this.renderAddToken()}
      </div>
    )
  }
}
