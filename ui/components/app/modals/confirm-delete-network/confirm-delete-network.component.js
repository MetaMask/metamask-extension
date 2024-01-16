import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';

export default class ConfirmDeleteNetwork extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeNetworkConfiguration: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
    networkNickname: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleDelete = async () => {
    await this.props.removeNetworkConfiguration(this.props.target);
    this.props.onConfirm();
    this.props.hideModal();
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
      >
        <ModalContent
          title={t('deleteNetworkTitle', [networkNickname])}
          description={t('deleteNetworkIntro')}
        />
      </Modal>
    );
  }
}
