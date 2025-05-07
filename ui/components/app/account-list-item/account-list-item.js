import React from 'react';
import PropTypes from 'prop-types';
import Identicon from '../../ui/identicon';
import AccountMismatchWarning from '../../ui/account-mismatch-warning/account-mismatch-warning.component';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

export default function AccountListItem({
  account,
  className,
  displayAddress = false,
  handleClick,
  icon = null,
}) {
  const {
    metadata: { name },
    address,
    balance,
  } = account;

  const showDefaultMismatchWarning = true;

  return (
    <div
      className={`account-list-item ${className}`}
      data-testid="account-list-item"
      onClick={() => handleClick?.({ name, address, balance })}
    >
      <div className="account-list-item__top-row">
        <Identicon
          address={address}
          className="account-list-item__identicon"
          diameter={18}
        />
        <div className="account-list-item__account-name">{name || address}</div>
        {icon ? (
          <div
            className="account-list-item__icon"
            data-testid="account-list-item-icon"
          >
            {icon}
          </div>
        ) : null}
        {showDefaultMismatchWarning && (
          <AccountMismatchWarning address={address} />
        )}
      </div>
      {displayAddress && name && (
        <div className="account-list-item__account-address">
          {normalizeSafeAddress(address)}
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
    id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
      snap: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        enabled: PropTypes.bool,
      }),
      keyring: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
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
