import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import AccountListItem from '../../send/account-list-item/account-list-item.component'

export default class AccountDropdownMini extends PureComponent {
  static propTypes = {
    accounts: PropTypes.array.isRequired,
    closeDropdown: PropTypes.func,
    disabled: PropTypes.bool,
    dropdownOpen: PropTypes.bool,
    onSelect: PropTypes.func,
    openDropdown: PropTypes.func,
    selectedAccount: PropTypes.object.isRequired,
  }

  static defaultProps = {
    closeDropdown: () => {},
    disabled: false,
    dropdownOpen: false,
    onSelect: () => {},
    openDropdown: () => {},
  }

  getListItemIcon (currentAccount, selectedAccount) {
    return currentAccount.address === selectedAccount.address && (
      <i
        className="fa fa-check fa-lg"
        style={{ color: '#02c9b1' }}
      />
    )
  }

  renderDropdown () {
    const { accounts, selectedAccount, closeDropdown, onSelect } = this.props

    return (
      <div>
        <div
          className="account-dropdown-mini__close-area"
          onClick={closeDropdown}
        />
        <div className="account-dropdown-mini__list">
          {
            accounts.map(account => (
              <AccountListItem
                key={account.address}
                account={account}
                displayBalance={false}
                displayAddress={false}
                handleClick={() => {
                  onSelect(account)
                  closeDropdown()
                }}
                icon={this.getListItemIcon(account, selectedAccount)}
              />
            ))
          }
        </div>
      </div>
    )
  }

  render () {
    const { disabled, selectedAccount, openDropdown, dropdownOpen } = this.props

    return (
      <div className="account-dropdown-mini">
        <AccountListItem
          account={selectedAccount}
          handleClick={() => !disabled && openDropdown()}
          displayBalance={false}
          displayAddress={false}
          icon={
            !disabled && <i
              className="fa fa-caret-down fa-lg"
              style={{ color: '#dedede' }}
            />
          }
        />
        { !disabled && dropdownOpen && this.renderDropdown() }
      </div>
    )
  }
}
