import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AccountListItem from '../../../../../components/app/account-list-item';
import NetworkDisplay from '../../../../../components/app/network-display';

export default class SignatureRequestHeader extends PureComponent {
  static propTypes = {
    fromAccount: PropTypes.object,
  };

  render() {
    const { fromAccount } = this.props;

    return (
      <div className="signature-request-header">
        <div className="signature-request-header--account">
          {fromAccount ? (
            <AccountListItem
              account={fromAccount}
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              hideDefaultMismatchWarning
              ///: END:ONLY_INCLUDE_IF
            />
          ) : null}
        </div>
        <div className="signature-request-header--network">
          <NetworkDisplay />
        </div>
      </div>
    );
  }
}
