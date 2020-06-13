import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import ConnectedAccountsListItem from './connected-accounts-list-item'
import ConnectedAccountsListOptions from './connected-accounts-list-options'
import { MenuItem } from '../../ui/menu'

export default class ConnectedAccountsList extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    accountToConnect: null,
  }

  static propTypes = {
    accountToConnect: PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    connectedAccounts: PropTypes.arrayOf(PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      lastActive: PropTypes.number,
    })).isRequired,
    connectAccount: PropTypes.func.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    removePermittedAccount: PropTypes.func,
    setSelectedAddress: PropTypes.func.isRequired,
    shouldRenderListOptions: (props, propName, componentName) => {
      if (props[propName]) {
        if (typeof props[propName] !== 'boolean') {
          return new Error(
            `${componentName}: '${propName}' must be a boolean if provided.`
          )
        }
        if (!props['removePermittedAccount']) {
          return new Error(
            `${componentName}: '${propName}' requires 'removePermittedAccount'.`
          )
        }
      }
    },
  }

  state = {
    accountWithOptionsShown: null,
  }

  disconnectAccount = () => {
    this.hideAccountOptions()
    this.props.removePermittedAccount(this.state.accountWithOptionsShown)
  }

  switchAccount = (address) => {
    this.hideAccountOptions()
    this.props.setSelectedAddress(address)
  }

  hideAccountOptions = () => {
    this.setState({ accountWithOptionsShown: null })
  }

  showAccountOptions = (address) => {
    this.setState({ accountWithOptionsShown: address })
  }

  renderUnconnectedAccount () {
    const { accountToConnect, connectAccount } = this.props
    const { t } = this.context

    if (!accountToConnect) {
      return null
    }

    const { address, name } = accountToConnect
    return (
      <ConnectedAccountsListItem
        className="connected-accounts-list__row--highlight"
        address={address}
        name={`${name} (…${address.substr(-4, 4)})`}
        status={t('statusNotConnected')}
        action={(
          <a className="connected-accounts-list__account-status-link" onClick={connectAccount}>
            {t('connect')}
          </a>
        )}
      />
    )
  }

  renderListItemOptions (address) {
    const { selectedAddress } = this.props
    const { accountWithOptionsShown } = this.state
    const { t } = this.context

    return (
      <ConnectedAccountsListOptions
        onHideOptions={this.hideAccountOptions}
        onShowOptions={this.showAccountOptions.bind(null, address)}
        show={accountWithOptionsShown === address}
      >
        {
          address === selectedAddress ? null : (
            <MenuItem
              iconClassName="fas fa-random"
              onClick={() => this.switchAccount(address)}
            >
              {t('switchToThisAccount')}
            </MenuItem>
          )
        }
        <MenuItem
          iconClassName="disconnect-icon"
          onClick={this.disconnectAccount}
        >
          {t('disconnectThisAccount')}
        </MenuItem>
      </ConnectedAccountsListOptions>
    )
  }

  renderListItemAction (address) {
    const { t } = this.context

    return (
      <a
        className="connected-accounts-list__account-status-link"
        onClick={() => this.switchAccount(address)}
      >
        {t('switchToThisAccount')}
      </a>
    )
  }

  render () {
    const { connectedAccounts, shouldRenderListOptions } = this.props
    const { t } = this.context

    return (
      <>
        <main className="connected-accounts-list">
          {this.renderUnconnectedAccount()}
          {
            connectedAccounts.map(({ address, name }, index) => {
              return (
                <ConnectedAccountsListItem
                  key={address}
                  address={address}
                  name={`${name} (…${address.substr(-4, 4)})`}
                  status={index === 0 ? t('active') : null}
                  options={shouldRenderListOptions ? this.renderListItemOptions(address) : null}
                  action={shouldRenderListOptions ? null : this.renderListItemAction(address)}
                />
              )
            })
          }
        </main>
      </>
    )
  }
}
