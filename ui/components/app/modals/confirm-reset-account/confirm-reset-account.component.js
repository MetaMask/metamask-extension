import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';
import { I18nContext } from '../../../../contexts/i18n';

export default class ConfirmResetAccount extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    resetAccount: PropTypes.func.isRequired,
  };

  static contextType = I18nContext;

  handleReset = () => {
    this.props.resetAccount().then(() => this.props.hideModal());
  };

  render() {
    const t = this.context;

    return (
      <Modal
        onSubmit={this.handleReset}
        onCancel={() => this.props.hideModal()}
        submitText={t('clear')}
        cancelText={t('nevermind')}
        submitType="danger-primary"
      >
        <ModalContent
          title={`${t('clearActivity')}?`}
          description={t('clearActivityDescription')}
        />
      </Modal>
    );
  }
}
