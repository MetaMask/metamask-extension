import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';
import { TRANSACTION_STATUSES } from '../../../../../shared/constants/transaction';
import CancelTransactionGasFee from './cancel-transaction-gas-fee';

export default class CancelTransaction extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    createCancelTransaction: PropTypes.func,
    hideModal: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    transactionStatus: PropTypes.string,
    newGasFee: PropTypes.string,
  };

  state = {
    busy: false,
  };

  componentDidUpdate() {
    const { transactionStatus, showTransactionConfirmedModal } = this.props;

    if (transactionStatus !== TRANSACTION_STATUSES.SUBMITTED) {
      showTransactionConfirmedModal();
    }
  }

  handleSubmit = async () => {
    const { createCancelTransaction, hideModal } = this.props;

    this.setState({ busy: true });

    await createCancelTransaction();
    this.setState({ busy: false }, () => hideModal());
  };

  handleCancel = () => {
    this.props.hideModal();
  };

  render() {
    const { t } = this.context;
    const { newGasFee } = this.props;
    const { busy } = this.state;

    return (
      <Modal
        headerText={t('attemptToCancel')}
        onClose={this.handleCancel}
        onSubmit={this.handleSubmit}
        onCancel={this.handleCancel}
        submitText={t('yesLetsTry')}
        cancelText={t('nevermind')}
        submitType="secondary"
        submitDisabled={busy}
      >
        <div>
          <div className="cancel-transaction__title">
            {t('cancellationGasFee')}
          </div>
          <div className="cancel-transaction__cancel-transaction-gas-fee-container">
            <CancelTransactionGasFee value={newGasFee} />
          </div>
          <div className="cancel-transaction__description">
            {t('attemptToCancelDescription')}
          </div>
        </div>
      </Modal>
    );
  }
}
