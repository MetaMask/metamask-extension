import { connect } from 'react-redux';
import {
  getUnapprovedTransactions,
  unconfirmedTransactionsListSelector,
} from '../../../selectors';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import ConfirmTransactionSwitch from './confirm-transaction-switch.component';

const mapStateToProps = (state, ownProps) => {
  const unapprovedTxs = getUnapprovedTransactions(state);
  const {
    match: { params = {}, url },
  } = ownProps;
  const confirmTransactionRoute = `${CONFIRM_TRANSACTION_ROUTE}/`;
  const urlId = url.includes(confirmTransactionRoute)
    ? url.split(confirmTransactionRoute)[1]
    : null;
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
