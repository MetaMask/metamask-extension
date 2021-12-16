import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';

export default class ConfirmStopWatching extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    stopWatching: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleStop = () => {
    this.props.stopWatching().then(() => this.props.hideModal());
  };

  render() {
    const { t } = this.context;

    return (
      <Modal
        onSubmit={this.handleStop}
        onCancel={() => this.props.hideModal()}
        submitText={t('stopWatching')}
        cancelText={t('cancel')}
      >
        <ModalContent
          title={`${t('stopWatchingTitle')}?`}
          description={t('stopWatchingDescription')}
        />
      </Modal>
    );
  }
}
