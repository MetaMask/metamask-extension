import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmTransactionBase from '../confirm-transaction-base';
import { SEND_ROUTE } from '../../helpers/constants/routes';

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
    editTransaction(txData);
    history.push(SEND_ROUTE);
  }

  shouldHideData() {
    const { txParams = {} } = this.props;
    return !txParams.data;
  }

  render() {
    const hideData = this.shouldHideData();

    return (
      <ConfirmTransactionBase
        actionKey="confirm"
        hideData={hideData}
        onEdit={(confirmTransactionData) =>
          this.handleEdit(confirmTransactionData)
        }
      />
    );
  }
}
