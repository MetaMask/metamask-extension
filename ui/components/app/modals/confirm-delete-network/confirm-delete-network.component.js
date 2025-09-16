import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';

import Modal, { ModalContent } from '../../modal';

export default class ConfirmDeleteNetwork extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeNetwork: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    networkNickname: PropTypes.string.isRequired,
    chainId: PropTypes.string.isRequired,
    isChainToDeleteSelected: PropTypes.bool,
    switchToEthereumNetwork: PropTypes.func,
    isMultichainAccountsFeatureEnabled: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleDelete = async () => {
    const {
      chainId,
      onConfirm,
      hideModal,
      removeNetwork,
      isChainToDeleteSelected,
      switchToEthereumNetwork,
      isMultichainAccountsFeatureEnabled,
    } = this.props;

    // NOTE: We only support EVM networks removal, so the conversion is safe here.
    const caipChainId = toEvmCaipChainId(chainId);

    // NOTE: ensure that we are not deleting a selected evm chain
    if (isChainToDeleteSelected) {
      await switchToEthereumNetwork?.(isMultichainAccountsFeatureEnabled);
    }

    await removeNetwork(caipChainId);

    onConfirm();
    hideModal();
  };

  render() {
    const { t } = this.context;
    const { networkNickname } = this.props;

    return (
      <Modal
        onSubmit={this.handleDelete}
        onCancel={() => this.props.hideModal()}
        submitText={t('delete')}
        cancelText={t('cancel')}
        submitType="danger-primary"
        testId="confirm-delete-network-modal"
      >
        <ModalContent
          title={t('deleteNetworkTitle', [networkNickname])}
          description={t('deleteNetworkIntro')}
        />
      </Modal>
    );
  }
}
