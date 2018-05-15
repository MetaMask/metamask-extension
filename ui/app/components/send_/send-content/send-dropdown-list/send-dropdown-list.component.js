import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AccountListItem from '../../account-list-item/'

export default class SendDropdownList extends Component {

  static propTypes = {
    accounts: PropTypes.array,
    closeDropdown: PropTypes.func,
    onSelect: PropTypes.func,
    activeAddress: PropTypes.string,
  };

  getListItemIcon (accountAddress, activeAddress) {
    return accountAddress === activeAddress
      ? <i className={`fa fa-check fa-lg`} style={ { color: '#02c9b1' } }/>
      : null
  }

  render () {
    const {
      accounts,
      closeDropdown,
      onSelect,
      activeAddress,
    } = this.props

    return (<div>
      <div
        className="send-v2__from-dropdown__close-area"
        onClick={() => closeDropdown()}
      />
      <div className="send-v2__from-dropdown__list">
        {accounts.map((account, index) => <AccountListItem
          account={account}
          className="account-list-item__dropdown"
          handleClick={() => {
            onSelect(account)
            closeDropdown()
          }}
          icon={this.getListItemIcon(account.address, activeAddress)}
          key={`send-dropdown-account-#${index}`}
        />)}
      </div>
    </div>)
  }

}

SendDropdownList.contextTypes = {
  t: PropTypes.func,
}
