import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmTransactionBase from '../confirm-transaction-base';
import { SEND_ROUTE } from '../../helpers/constants/routes';
import { TransactionType } from '../../../shared/constants/transaction';

export default class ConfirmSendEther extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    editTransaction: PropTypes.func,
    history: PropTypes.object,
    txParams: PropTypes.object,
  };

  handleEdit({ txData }) {
    const { editTransaction, history } = this.props;
    editTransaction(txData).then(() => {
      history.push(SEND_ROUTE);
    });
  }

  shouldHideData() {
    const { txParams = {} } = this.props;
    return !txParams.data;
  }

  render() {
    const hideData = this.shouldHideData();
    const { txParams: { to: tokenAddress, value } = {}, type } = this.props;

    return (
      <ConfirmTransactionBase
        actionKey="confirm"
        hideData={hideData}
        onEdit={(confirmTransactionData) =>
          this.handleEdit(confirmTransactionData)
        }
        tokenAddress={tokenAddress}
        isSendWithApproval={
          type === TransactionType.tokenMethodApprove &&
          value &&
          value !== '0x0'
        }
      />
    );
  }
}
