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
  };

  handleEdit({ txData }) {
    const { editTransaction, history } = this.props;
    editTransaction(txData).then(() => {
      history.push(SEND_ROUTE);
    });
  }

  render() {
    return (
      <ConfirmTransactionBase
        actionKey="confirm"
        onEdit={(confirmTransactionData) =>
          this.handleEdit(confirmTransactionData)
        }
      />
    );
  }
}
