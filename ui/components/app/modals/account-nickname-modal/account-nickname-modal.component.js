import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import NicknamePopover from '../../../ui/nickname-popover';

export default class AccountNicknameModal extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    addNicknameModal: PropTypes.func.isRequired,
    address: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    className: PropTypes.string,
  };

  render() {
    const { t } = this.context;
    const {
      className,
      address,
      hideModal,
      addNicknameModal,
      nickname,
    } = this.props;

    return (
      <div
        className={classnames(className, 'account-nickname-modal')}
        style={{ borderRadius: '4px' }}
      >
        <NicknamePopover
          address={address}
          onClose={hideModal}
          onAdd={addNicknameModal}
          nickname={nickname}
        />
      </div>
    );
  }
}
