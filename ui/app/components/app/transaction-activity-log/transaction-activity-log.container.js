import { connect } from 'react-redux'
import R from 'ramda'
import TransactionActivityLog from './transaction-activity-log.component'
import { conversionRateSelector, getNativeCurrency } from '../../../selectors/selectors'
import { combineTransactionHistories } from './transaction-activity-log.util'
import {
  TRANSACTION_RESUBMITTED_EVENT,
  TRANSACTION_CANCEL_ATTEMPTED_EVENT,
} from './transaction-activity-log.constants'

const matchesEventKey = matchEventKey => ({ eventKey }) => eventKey === matchEventKey

const mapStateToProps = state => {
  return {
    conversionRate: conversionRateSelector(state),
    nativeCurrency: getNativeCurrency(state),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    transactionGroup: {
      transactions = [],
      primaryTransaction,
    } = {},
    ...restOwnProps
  } = ownProps

  const activities = combineTransactionHistories(transactions)
  const inlineRetryIndex = R.findLastIndex(matchesEventKey(TRANSACTION_RESUBMITTED_EVENT))(activities)
  const inlineCancelIndex = R.findLastIndex(matchesEventKey(TRANSACTION_CANCEL_ATTEMPTED_EVENT))(activities)

  return {
    ...stateProps,
    ...dispatchProps,
    ...restOwnProps,
    activities,
    inlineRetryIndex,
    inlineCancelIndex,
    primaryTransaction,
  }
}

export default connect(mapStateToProps, null, mergeProps)(TransactionActivityLog)
