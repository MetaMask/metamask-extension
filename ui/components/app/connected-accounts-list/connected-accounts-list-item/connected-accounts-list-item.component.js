import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Identicon from '../../../ui/identicon';

export default class ConnectedAccountsListItem extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static propTypes = {
    address: PropTypes.string.isRequired,
    className: PropTypes.string,
    name: PropTypes.node.isRequired,
    status: PropTypes.string,
    action: PropTypes.node,
    options: PropTypes.node,
  };

  static defaultProps = {
    className: null,
    options: null,
    action: null,
  };

  render() {
    const { address, className, name, status, action, options } = this.props;

    return (
      <div className={classnames('connected-accounts-list__row', className)}>
        <div className="connected-accounts-list__row-content">
          <Identicon
            className="connected-accounts-list__identicon"
            address={address}
            diameter={32}
          />
          <div>
            <p className="connected-accounts-list__account-name">
              <strong>{name}</strong>
            </p>
            {status ? (
              <p className="connected-accounts-list__account-status">
                &nbsp;&nbsp;
                {status}
              </p>
            ) : null}
            {action}
          </div>
        </div>
        {options}
      </div>
    );
  }
}
