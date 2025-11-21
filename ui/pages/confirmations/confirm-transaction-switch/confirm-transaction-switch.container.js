import React from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom-v5-compat';
import {
  getUnapprovedTransactions,
  unconfirmedTransactionsListSelector,
} from '../../../selectors';
import ConfirmTransactionSwitch from './confirm-transaction-switch.component';

const mapStateToProps = (state, ownProps) => {
  const unapprovedTxs = getUnapprovedTransactions(state);
  const { id: transactionId } = ownProps;

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);
  const totalUnconfirmed = unconfirmedTransactions.length;

  const transaction = totalUnconfirmed
    ? unapprovedTxs[transactionId] || unconfirmedTransactions[0]
    : {};

  return {
    txData: transaction,
  };
};

const ConnectedConfirmTransactionSwitch = connect(mapStateToProps)(
  ConfirmTransactionSwitch,
);

const ConfirmTransactionSwitchContainer = () => {
  const params = useParams();
  const id = params?.id;
  return <ConnectedConfirmTransactionSwitch id={id} />;
};

export default ConfirmTransactionSwitchContainer;
