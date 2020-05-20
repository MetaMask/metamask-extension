import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import ConnectedAccountsListPermissions from './connected-accounts-list-permissions'
import ConnectedAccountsListItem from './connected-accounts-list-item'
import ConnectedAccountsListOptions from './connected-accounts-list-options'
import { MenuItem } from '../../ui/menu'

export default class ConnectedAccountsList extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    accountToConnect: null,
    permissions: undefined,
  }

  static propTypes = {
    accountToConnect: PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    connectedAccounts: PropTypes.arrayOf(PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      lastActive: PropTypes.number.isRequired,
    })).isRequired,
    permissions: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })),
    selectedAddress: PropTypes.string.isRequired,
    addPermittedAccount: PropTypes.func.isRequired,
    removePermittedAccount: PropTypes.func.isRequired,
    setSelectedAddress: PropTypes.func.isRequired,
  }

  state = {
    accountWithOptionsShown: null,
  }

  connectAccount = () => {
    this.props.addPermittedAccount(this.props.accountToConnect?.address)
  }

  disconnectAccount = () => {
    this.hideAccountOptions()
    this.props.removePermittedAccount(this.state.accountWithOptionsShown)
  }

  switchAccount = () => {
    this.hideAccountOptions()
    this.props.setSelectedAddress(this.state.accountWithOptionsShown)
  }

  hideAccountOptions = () => {
    this.setState({ accountWithOptionsShown: null })
  }

  showAccountOptions = (address) => {
    this.setState({ accountWithOptionsShown: address })
  }

  renderUnconnectedAccount () {
    const { accountToConnect } = this.props
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
        status={(
          <>
            {t('statusNotConnected')}
            &nbsp;&middot;&nbsp;
            <a className="connected-accounts-list__account-status-link" onClick={this.connectAccount}>
              {t('connect')}
            </a>
          </>
        )}
      />
    )
  }

  render () {
    const { connectedAccounts, permissions, selectedAddress } = this.props
    const { accountWithOptionsShown } = this.state
    const { t } = this.context

    return (
      <>
        <main className="connected-accounts-list">
          {this.renderUnconnectedAccount()}
          {connectedAccounts.map(({ address, name, lastActive }, index) => (
            <ConnectedAccountsListItem
              key={address}
              address={address}
              name={`${name} (…${address.substr(-4, 4)})`}
              status={index === 0 ? t('primary') : `${t('lastActive')}: ${DateTime.fromMillis(lastActive).toISODate()}`}
              options={(
                <ConnectedAccountsListOptions
                  onHideOptions={this.hideAccountOptions}
                  onShowOptions={this.showAccountOptions.bind(null, address)}
                  show={accountWithOptionsShown === address}
                >
                  {
                    address === selectedAddress ? null : (
                      <MenuItem
                        iconClassName="fas fa-random"
                        onClick={this.switchAccount}
                      >
                        {t('switchToThisAccount')}
                      </MenuItem>
                    )
                  }
                  <MenuItem
                    iconClassNames="disconnect-icon"
                    onClick={this.disconnectAccount}
                  >
                    {t('disconnectThisAccount')}
                  </MenuItem>
                </ConnectedAccountsListOptions>
              )}
            />
          ))}
        </main>
        <ConnectedAccountsListPermissions permissions={permissions} />
      </>
    )
  }
}
