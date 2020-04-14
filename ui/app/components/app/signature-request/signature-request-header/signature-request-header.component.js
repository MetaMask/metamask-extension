import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import AccountListItem from '../../../../pages/send/account-list-item/account-list-item.component'
import NetworkDisplay from '../../network-display'

export default class SignatureRequestHeader extends PureComponent {
  static propTypes = {
    selectedAccount: PropTypes.object,
  }

  render () {
    const { selectedAccount } = this.props

    return (
      <div className="signature-request-header">
        <div className="signature-request-header--account">
          {selectedAccount && (
            <AccountListItem
              displayBalance={false}
              account={selectedAccount}
            />
          )}
        </div>
        <div className="signature-request-header--network">
          <NetworkDisplay colored={false} />
        </div>
      </div>
    )
  }
}
