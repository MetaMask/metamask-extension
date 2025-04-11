import { findLastIndex } from 'lodash';
import { connect } from 'react-redux';

import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import {
  conversionRateSelector,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors';
import TransactionActivityLog from './transaction-activity-log.component';
import {
  TRANSACTION_RESUBMITTED_EVENT,
  TRANSACTION_CANCEL_ATTEMPTED_EVENT,
} from './transaction-activity-log.constants';
import { combineTransactionHistories } from './transaction-activity-log.util';

const matchesEventKey =
  (matchEventKey) =>
  ({ eventKey }) =>
    eventKey === matchEventKey;

const mapStateToProps = (state) => {
  return {
    conversionRate: conversionRateSelector(state),
    nativeCurrency: getNativeCurrency(state),
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    transactionGroup: { transactions = [], primaryTransaction } = {},
    ...restOwnProps
  } = ownProps;

  const activities = combineTransactionHistories(transactions);
  const inlineRetryIndex = findLastIndex(
    activities,
    matchesEventKey(TRANSACTION_RESUBMITTED_EVENT),
  );
  const inlineCancelIndex = findLastIndex(
    activities,
    matchesEventKey(TRANSACTION_CANCEL_ATTEMPTED_EVENT),
  );

  return {
    ...stateProps,
    ...dispatchProps,
    ...restOwnProps,
    activities,
    inlineRetryIndex,
    inlineCancelIndex,
    primaryTransaction,
  };
};

export default connect(
  mapStateToProps,
  null,
  mergeProps,
)(TransactionActivityLog);
