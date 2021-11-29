import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover';

const AccountNicknameModal = (props, context) => {
  const { addressBookEntry, addToAddressBook, hideModal, className } = props;

  return (
    <div className={classnames(className, 'account-nickname-modal')}>
      <UpdateNicknamePopover
        address={addressBookEntry?.address}
        nickname={addressBookEntry?.name}
        memo={addressBookEntry?.memo}
        onClose={hideModal}
        onAdd={addToAddressBook}
      />
    </div>
  );
};

export default AccountNicknameModal;
