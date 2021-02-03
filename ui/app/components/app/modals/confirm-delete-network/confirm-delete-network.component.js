import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';

export default class ConfirmDeleteNetwork extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    delRpcTarget: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleDelete = () => {
    this.props.delRpcTarget(this.props.target).then(() => {
      this.props.onConfirm();
      this.props.hideModal();
    });
  };

  render() {
    const { t } = this.context;

    return (
      <Modal
        onSubmit={this.handleDelete}
        onCancel={() => this.props.hideModal()}
        submitText={t('delete')}
        cancelText={t('cancel')}
        submitType="danger"
      >
        <ModalContent
          title={t('deleteNetwork')}
          description={t('deleteNetworkDescription')}
        />
      </Modal>
    );
  }
}
