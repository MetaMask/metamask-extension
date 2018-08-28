import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import withMethodData from '../../higher-order-components/with-method-data'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, retryTransaction } from '../../actions'
import { hexToDecimal } from '../../helpers/conversions.util'
import { formatDate } from '../../util'

const mapStateToProps = (state, ownProps) => {
  const { transaction: { txParams: { value, nonce } = {}, time } = {} } = ownProps

  const nonceAndDate = nonce ? `#${hexToDecimal(nonce)} - ${formatDate(time)}` : formatDate(time)

  return {
    value,
    nonceAndDate,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSelectedToken: tokenAddress => dispatch(setSelectedToken(tokenAddress)),
    retryTransaction: transactionId => dispatch(retryTransaction(transactionId)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  withMethodData,
)(TransactionListItem)
