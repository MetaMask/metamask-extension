import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import AccountListItem from '../../../../pages/send/account-list-item/account-list-item.component'
import NetworkDisplay from '../../network-display'

export default class SignatureRequestHeader extends PureComponent {
  static propTypes = {
    fromAccount: PropTypes.object,
  }

  render () {
    const { fromAccount } = this.props

    return (
      <div className="signature-request-header">
        <div className="signature-request-header--account">
          {fromAccount && (
            <AccountListItem
              displayBalance={false}
              account={fromAccount}
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
