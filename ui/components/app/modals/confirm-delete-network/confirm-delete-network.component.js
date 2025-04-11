import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';

export default class ConfirmDeleteNetwork extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeNetwork: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    switchEvmNetwork: PropTypes.func.isRequired,
    networkNickname: PropTypes.string.isRequired,
    chainId: PropTypes.string.isRequired,
    currentChainId: PropTypes.string.isRequired,
    ethereumMainnetClientId: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleDelete = async () => {
    const {
      chainId,
      currentChainId,
      ethereumMainnetClientId,
      onConfirm,
      hideModal,
      removeNetwork,
      switchEvmNetwork,
    } = this.props;

    // An implicit auto-switch in the network-controller should occur
    // to mainnet when the network being deleted is the current selected
    // EVM network and the active network is a non-EVM network.
    //
    // TODO: This logic must be ported to the
    // multichain-network-controller so the "remove use case" can
    // be properly handled.
    if (chainId === currentChainId) {
      await switchEvmNetwork(ethereumMainnetClientId);
    }

    await removeNetwork(chainId);

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
