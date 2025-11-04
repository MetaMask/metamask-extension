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
  const unapprovedTxs = getUnapprovedTransactions(state);
  const { location = {}, params = {} } = ownProps;
  const confirmTransactionRoute = `${CONFIRM_TRANSACTION_ROUTE}/`;
  // Extract the id safely (strip any trailing segments or query/hash)
  const rawAfterRoute = location?.pathname?.startsWith(confirmTransactionRoute)
    ? location.pathname.slice(confirmTransactionRoute.length)
    : null;
  const urlId = rawAfterRoute
    ? rawAfterRoute.split('/')[0].split('?')[0].split('#')[0]
    : null;
  const routeTxId = params.id || urlId || null;

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);
  const totalUnconfirmed = unconfirmedTransactions.length;
  let txData = {};
  let resolvedTxId = routeTxId;
  if (totalUnconfirmed) {
    // 1) If the route id is still unapproved, use it.
    const fromUnapproved = routeTxId ? unapprovedTxs[routeTxId] : undefined;
    // 2) Otherwise, if the route id exists anywhere in the unconfirmed list (e.g. submitted/signed), use that.
    const fromAnyUnconfirmed =
      !fromUnapproved && routeTxId
        ? unconfirmedTransactions.find((tx) => tx.id === routeTxId)
        : undefined;
    // 3) Otherwise, fall back to the first unconfirmed tx.
    txData = fromUnapproved || fromAnyUnconfirmed || unconfirmedTransactions[0];
    resolvedTxId = txData?.id ?? null;
  }

  return {
    txData,
    // Optional props that allow the component to repair the URL if needed:
    routeTxId,
    resolvedTxId,
    hasRouteIdMismatch: Boolean(
      routeTxId && resolvedTxId && routeTxId !== resolvedTxId,
    ),
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps),
)(ConfirmTransactionSwitch);
