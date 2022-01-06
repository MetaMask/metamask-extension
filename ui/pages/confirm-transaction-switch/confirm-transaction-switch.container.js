import { connect } from 'react-redux';
import { unconfirmedTransactionsListSelector } from '../../selectors';
import ConfirmTransactionSwitch from './confirm-transaction-switch.component';

const mapStateToProps = (state, ownProps) => {
  const {
    metamask: { unapprovedTxs },
  } = state;
  const {
    match: { params = {}, url },
  } = ownProps;
  const urlId = url?.match(/\d+/u) && url?.match(/\d+/u)[0];
  const { id: paramsId } = params;
  const transactionId = paramsId || urlId;

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);
  const totalUnconfirmed = unconfirmedTransactions.length;
  const transaction = totalUnconfirmed
    ? unapprovedTxs[transactionId] || unconfirmedTransactions[0]
    : {};

  return {
    txData: transaction,
  };
};

export default connect(mapStateToProps)(ConfirmTransactionSwitch);
