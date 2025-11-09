import { connect } from 'react-redux';
import { compose } from 'redux';
import {
  getUnapprovedTransactions,
  unconfirmedTransactionsListSelector,
} from '../../../selectors';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import ConfirmTransactionSwitch from './confirm-transaction-switch.component';

const mapStateToProps = (state, ownProps) => {
  const { location = {}, params = {} } = ownProps;
  const { pathname = '' } = location;

  const confirmTransactionRoute = `${CONFIRM_TRANSACTION_ROUTE}/`;
  // v5-compat: Extract ID from pathname, split by [/?#] to handle query params/hashes (e.g., /confirm-transaction/123?query=foo → "123")
  const urlId = pathname.includes(confirmTransactionRoute)
    ? pathname.split(confirmTransactionRoute)[1]?.split(/[/?#]/u)[0]
    : null;

  const transactionId = params.id || urlId;

  const unapprovedTxs = getUnapprovedTransactions(state);
  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);
  const totalUnconfirmed = unconfirmedTransactions.length;

  const transaction = totalUnconfirmed
    ? unapprovedTxs[transactionId] || unconfirmedTransactions[0]
    : {};

  return {
    txData: transaction,
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps),
)(ConfirmTransactionSwitch);
