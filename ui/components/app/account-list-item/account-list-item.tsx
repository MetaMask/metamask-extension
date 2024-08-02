import React from 'react';
import { InternalAccount } from '@metamask/keyring-api';
import Identicon from '../../ui/identicon';
import AccountMismatchWarning from '../../ui/account-mismatch-warning/account-mismatch-warning.component';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

type AccountListItemProps = {
  /**
   * An account object that has name, address, and balance data
   */
  account: InternalAccount;
  /**
   * Additional className to add to the root div element of AccountListItem
   */
  className?: string;
  /**
   * Display the address of the account object
   */
  displayAddress?: boolean;
  /**
   * The onClick handler of the AccountListItem
   */
  handleClick?: (account: InternalAccount | null) => void;
  /**
   * Pass icon component to be displayed. Currently not used
   */
  icon?: React.ReactNode;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  /**
   * MMI Prop, will hide the default AccountMismatchWarning when needed
   */
  hideDefaultMismatchWarning?: boolean;
  ///: END:ONLY_INCLUDE_IF
};

const AccountListItem = ({
  account,
  className,
  displayAddress = false,
  handleClick,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  hideDefaultMismatchWarning = false,
  ///: END:ONLY_INCLUDE_IF
  icon = null,
}: AccountListItemProps) => {
  const {
    metadata: { name },
    address,
    balance,
  } = account;

  let showDefaultMismatchWarning = true;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  showDefaultMismatchWarning = !hideDefaultMismatchWarning;
  ///: END:ONLY_INCLUDE_IF

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
};

export default React.memo(AccountListItem);
