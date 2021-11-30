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
   * an account data that have name, address, and balance inside it
   */
  account: PropTypes.object,
  /**
   * adding css class for account list item
   */
  className: PropTypes.string,
  /**
   * show address of the account
   */
  displayAddress: PropTypes.bool,
  /**
   * give expected behavior as function after the button clicked
   */
  handleClick: PropTypes.func,
  /**
   * display icon content on the right side of the component
   */
  icon: PropTypes.node,
};
