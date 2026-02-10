import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalContent } from '../../modal';
import { queryClient } from '../../../../contexts/query-client';
import { transactionsQueryKey } from '../../../../../shared/acme-controller/queries';

export default class ConfirmResetAccount extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    resetAccount: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleReset = () => {
    this.props.resetAccount().then(() => {
      queryClient.removeQueries({ queryKey: transactionsQueryKey });
      this.props.hideModal();
    });
  };

  render() {
    const { t } = this.context;

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
