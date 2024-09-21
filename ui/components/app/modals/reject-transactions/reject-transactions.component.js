import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from '../../modal';

export default class RejectTransactionsModal extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    unapprovedTxCount: PropTypes.number.isRequired,
    isRequestType: PropTypes.bool,
  };

  onSubmit = async () => {
    const { onSubmit, hideModal } = this.props;

    await onSubmit();
    hideModal();
  };

  render() {
    const { t } = this.context;
    const { hideModal, unapprovedTxCount, isRequestType } = this.props;

    return (
      <Modal
        headerText={
          isRequestType
            ? t('rejectRequestsN', [unapprovedTxCount])
            : t('rejectTxsN', [unapprovedTxCount])
        }
        onClose={hideModal}
        onSubmit={this.onSubmit}
        onCancel={hideModal}
        submitText={t('rejectAll')}
        cancelText={t('cancel')}
      >
        <div>
          <div className="reject-transactions__description">
            {isRequestType
              ? t('rejectRequestsDescription', [unapprovedTxCount])
              : t('rejectTxsDescription', [unapprovedTxCount])}
          </div>
        </div>
      </Modal>
    );
  }
}
