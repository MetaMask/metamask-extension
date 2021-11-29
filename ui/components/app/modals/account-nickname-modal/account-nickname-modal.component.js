import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import classnames from 'classnames';
import {
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
} from '../../../../selectors';
import NicknamePopover from '../../../ui/nickname-popover';

const AccountNicknameModal = ({
  hideModal,
  addNicknameModal,
  address,
  nickname,
  className,
}) => {
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const chainId = useSelector(getCurrentChainId);

  const explorerLink = getAccountLink(
    address,
    chainId,
    { blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null },
    null,
  );

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
        explorerLink={explorerLink}
      />
    </div>
  );
};

AccountNicknameModal.propTypes = {
  hideModal: PropTypes.func.isRequired,
  addNicknameModal: PropTypes.func.isRequired,
  address: PropTypes.string.isRequired,
  nickname: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default AccountNicknameModal;
