import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover';

const AccountNicknameModal = (props, context) => {
  const { className, address, nickname, hideModal } = props;

  return (
    <div className={classnames(className, 'account-nickname-modal')}>
      <UpdateNicknamePopover address={address} onClose={hideModal} />
    </div>
  );
};

export default AccountNicknameModal;
