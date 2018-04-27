import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AccountListItem from '../../../account-list-item/account-list-item.container'

export default class FromDropdown extends Component {

  static propTypes = {
    accounts: PropTypes.array,
    closeDropdown: PropTypes.func,
    dropdownOpen: PropTypes.bool,
    onSelect: PropTypes.func,
    openDropdown: PropTypes.func,
    selectedAccount: PropTypes.object,
  };

  renderListItemIcon (icon, color) {
    return <i className={`fa ${icon} fa-lg`} style={ { color } }/>
  }

  getListItemIcon (currentAccount, selectedAccount) {
    return currentAccount.address === selectedAccount.address
      ? this.renderListItemIcon('fa-check', '#02c9b1')
      : null
  }

  renderDropdown () {
    const {
      accounts,
      closeDropdown,
      onSelect,
      selectedAccount,
    } = this.props

    return (<div>
      <div
        className="send-v2__from-dropdown__close-area"
        onClick={() => closeDropdown}
      />
      <div className="send-v2__from-dropdown__list">
        {...accounts.map((account, index) => <AccountListItem
          account={account}
          className="account-list-item__dropdown"
          handleClick={() => {
            onSelect(account)
            closeDropdown()
          }}
          icon={this.getListItemIcon(account, selectedAccount.address)}
          key={`from-dropdown-account-#${index}`}
        />)}
      </div>
    </div>)
  }

  render () {
    const {
      dropdownOpen,
      openDropdown,
      selectedAccount,
    } = this.props

    return <div className="send-v2__from-dropdown">
      <AccountListItem
        account={selectedAccount}
        handleClick={openDropdown}
        icon={this.renderListItemIcon('fa-caret-down', '#dedede')}
      />
      {dropdownOpen && this.renderDropdown()},
    </div>
  }

}

FromDropdown.contextTypes = {
  t: PropTypes.func,
}
