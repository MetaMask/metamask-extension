import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  setTransactionToConfirm,
  clearConfirmTransaction,
} from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { isTokenMethodAction } from '../../helpers/utils/transactions.util';
import { fetchBasicGasEstimates } from '../../ducks/gas/gas.duck';

import {
  getContractMethodData,
  getTokenParams,
  setDefaultHomeActiveTabName,
} from '../../store/actions';
import { unconfirmedTransactionsListSelector } from '../../selectors';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getSendTo } from '../../ducks/send';
import ConfirmTransaction from './confirm-transaction.component';

const mapStateToProps = (state, ownProps) => {
  const {
    metamask: { unapprovedTxs },
  } = state;
  const {
    match: { params = {} },
  } = ownProps;
  const { id } = params;
  const sendTo = getSendTo(state);

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);
  const totalUnconfirmed = unconfirmedTransactions.length;
  const transaction = totalUnconfirmed
    ? unapprovedTxs[id] || unconfirmedTransactions[0]
    : {};
  const { id: transactionId, type } = transaction;

  return {
    totalUnapprovedCount: totalUnconfirmed,
    sendTo,
    unapprovedTxs,
    id,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    paramsTransactionId: id && String(id),
    transactionId: transactionId && String(transactionId),
    transaction,
    isTokenMethodAction: isTokenMethodAction(type),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setTransactionToConfirm: (transactionId) => {
      dispatch(setTransactionToConfirm(transactionId));
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    getContractMethodData: (data) => dispatch(getContractMethodData(data)),
    getTokenParams: (tokenAddress) => dispatch(getTokenParams(tokenAddress)),
    setDefaultHomeActiveTabName: (tabName) =>
      dispatch(setDefaultHomeActiveTabName(tabName)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmTransaction);
