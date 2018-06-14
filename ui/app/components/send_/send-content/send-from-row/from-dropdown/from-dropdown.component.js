import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AccountListItem from '../../../account-list-item/'
import SendDropdownList from '../../send-dropdown-list/'

export default class FromDropdown extends Component {

  static propTypes = {
    accounts: PropTypes.array,
    closeDropdown: PropTypes.func,
    dropdownOpen: PropTypes.bool,
    onSelect: PropTypes.func,
    openDropdown: PropTypes.func,
    selectedAccount: PropTypes.object,
  };

  render () {
    const {
      accounts,
      closeDropdown,
      dropdownOpen,
      openDropdown,
      selectedAccount,
      onSelect,
    } = this.props

    return <div className="send-v2__from-dropdown">
      <AccountListItem
        account={selectedAccount}
        handleClick={openDropdown}
        icon={<i className={`fa fa-caret-down fa-lg`} style={ { color: '#dedede' } }/>}
      />
      {dropdownOpen && <SendDropdownList
        accounts={accounts}
        closeDropdown={closeDropdown}
        onSelect={onSelect}
        activeAddress={selectedAccount.address}
      />}
    </div>
  }

}

FromDropdown.contextTypes = {
  t: PropTypes.func,
}
