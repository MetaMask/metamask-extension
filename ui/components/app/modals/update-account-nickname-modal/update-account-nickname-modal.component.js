import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover';

const AccountNicknameModal = (props, context) => {
  console.log(
    '🚀 ~ file: update-account-nickname-modal.component.js ~ line 7 ~ AccountNicknameModal ~ props',
    props,
  );
  const { className, address, nickname, hideModal, addToAddressBook } = props;

  return (
    <div className={classnames(className, 'account-nickname-modal')}>
      <UpdateNicknamePopover
        address={address}
        onClose={hideModal}
        onAdd={addToAddressBook}
      />
    </div>
  );
};

export default AccountNicknameModal;
