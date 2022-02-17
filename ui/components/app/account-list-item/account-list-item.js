import React from 'react';
import PropTypes from 'prop-types';
import Identicon from '../../ui/identicon';
import AccountMismatchWarning from '../../ui/account-mismatch-warning/account-mismatch-warning.component';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

export default function AccountListItem({
  account,
  className,
  displayAddress = false,
  handleClick,
  icon = null,
}) {
  const { name, address, balance } = account || {};

  return (
    <div
      className={`account-list-item ${className}`}
      onClick={() => handleClick?.({ name, address, balance })}
    >
      <div className="account-list-item__top-row">
        <Identicon
          address={address}
          className="account-list-item__identicon"
          diameter={18}
        />
        <div className="account-list-item__account-name">{name || address}</div>
        {icon ? <div className="account-list-item__icon">{icon}</div> : null}
        <AccountMismatchWarning address={address} />
      </div>

      {displayAddress && name && (
        <div className="account-list-item__account-address">
          {toChecksumHexAddress(address)}
        </div>
      )}
    </div>
  );
}

AccountListItem.propTypes = {
  /**
   * An account object that has name, address, and balance data
   */
  account: PropTypes.shape({
    address: PropTypes.string.isRequired,
    balance: PropTypes.string,
    name: PropTypes.string,
  }),
  /**
   * Additional className to add to the root div element of AccountListItem
   */
  className: PropTypes.string,
  /**
   * Display the address of the account object
   */
  displayAddress: PropTypes.bool,
  /**
   * The onClick handler of the AccountListItem
   */
  handleClick: PropTypes.func,
  /**
   * Pass icon component to be displayed. Currently not used
   */
  icon: PropTypes.node,
};
