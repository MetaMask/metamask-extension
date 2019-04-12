import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import AccountDropdownMini from './account-dropdown-mini.component'

// import actions from '../../actions'

import {
  // getCurrentAccountWithSendEtherInfo,
  accountsWithSendEtherInfoSelector,
} from '../../../selectors/selectors'

class AccountDropdownMiniContainer extends Component {

  static propTypes = {
    accounts: PropTypes.array.isRequired,
    selectedAccount: PropTypes.object.isRequired,
    onSelect: PropTypes.func, // for passing back newly selected account
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state = {
      selectedAccount: props.selectedAccount,
      accountDropdownOpen: false,
    }
  }

  render () {

    const { accounts, onSelect } = this.props
    const { selectedAccount } = this.state

    return (
      <AccountDropdownMini
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelect={account => {
          this.setState({ selectedAccount: account })
          if (onSelect) onSelect(account)
        }}
        dropdownOpen={this.state.accountDropdownOpen}
        openDropdown={() => this.setState({ accountDropdownOpen: true })}
        closeDropdown={() => this.setState({ accountDropdownOpen: false })}
      />
    )
  }
}

const mapStateToProps = state => {
  return {
    accounts: accountsWithSendEtherInfoSelector(state),
  }
}

export default connect(
  mapStateToProps,
)(AccountDropdownMiniContainer)
