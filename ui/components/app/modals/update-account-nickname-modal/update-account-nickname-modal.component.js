import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover';

const AccountNicknameModal = (props, context) => {
  const {
    address,
    addressBookEntry,
    addToAddressBook,
    hideModal,
    className,
  } = props;

  return (
    <div className={classnames(className, 'account-nickname-modal')}>
      <UpdateNicknamePopover
        address={
          addressBookEntry?.address ? addressBookEntry?.address : address
        }
        nickname={addressBookEntry?.name}
        memo={addressBookEntry?.memo}
        onClose={hideModal}
        onAdd={addToAddressBook}
      />
    </div>
  );
};

AccountNicknameModal.propTypes = {
  address: PropTypes.string.isRequired,
  addressBookEntry: PropTypes.object,
  addToAddressBook: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default AccountNicknameModal;
