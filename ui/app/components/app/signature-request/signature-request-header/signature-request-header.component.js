import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import AccountDropdownMini from '../../../ui/account-dropdown-mini'
import NetworkDisplay from '../../network-display'

export default class SignatureRequestHeader extends PureComponent {
  static propTypes = {
    selectedAccount: PropTypes.object.isRequired,
    accounts: PropTypes.object,
  }

  render () {
    const { selectedAccount, accounts } = this.props
    return (
      <div className="signature-request-header">
        <div className="signature-request-header--account">
          {selectedAccount && accounts && <AccountDropdownMini
            selectedAccount={selectedAccount}
            accounts={accounts}
            disabled
          />}
          {name}
        </div>
        <div className="signature-request-header--network">
          <NetworkDisplay colored={false} />
        </div>
      </div>
    )
  }
}
