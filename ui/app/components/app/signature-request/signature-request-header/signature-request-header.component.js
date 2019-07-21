import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import AccountDropdownMini from '../../../ui/account-dropdown-mini'

export default class SignatureRequest extends PureComponent {
  static propTypes = {
    selectedAccount: PropTypes.object.isRequired,
    accounts: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { selectedAccount, accounts } = this.props
    return (
      <div className="signature-request-header">
        {selectedAccount && accounts && <AccountDropdownMini
          selectedAccount={selectedAccount}
          accounts={accounts}
          disabled
        />}
        {name}
      </div>
    )
  }
}
