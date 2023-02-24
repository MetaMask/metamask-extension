import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';

export default class TransactionFailed extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    hideModal: PropTypes.func,
    errorMessage: PropTypes.string,
    closeNotification: PropTypes.bool,
    operationFailed: PropTypes.bool,
  };

  handleSubmit = () => {
    const { hideModal, closeNotification } = this.props;
    if (closeNotification) {
      global.platform.closeCurrentWindow();
    }
    hideModal();
  };

  render() {
    const { t } = this.context;

    return (
      <Modal onSubmit={this.handleSubmit} submitText={t('ok')}>
        <div className="transaction-failed__content">
          <img src="images/warning.svg" alt="" />
          <div className="transaction-failed__title">
            {this.props.operationFailed
              ? `${t('operationFailed')}!`
              : `${t('transactionFailed')}!`}
          </div>
          <div className="transaction-failed__description">
            {this.props.errorMessage}
          </div>
        </div>
      </Modal>
    );
  }
}
