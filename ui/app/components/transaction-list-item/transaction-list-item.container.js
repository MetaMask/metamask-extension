import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import withMethodData from '../../higher-order-components/with-method-data'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, retryTransaction } from '../../actions'
import { getEthFromWeiHex, getValueFromWeiHex } from '../../helpers/conversions.util'
import { formatCurrency } from '../../helpers/confirm-transaction/util'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const { currentCurrency, conversionRate } = metamask
  const { transaction: { txParams: { value } = {} } = {} } = ownProps
  const ethTransactionAmount = getEthFromWeiHex({ value, conversionRate })
  const fiatTransactionAmount = getValueFromWeiHex({
    value, conversionRate, toCurrency: currentCurrency, numberOfDecimals: 2,
  })
  const fiatFormattedAmount = formatCurrency(fiatTransactionAmount, currentCurrency)
  const fiatDisplayValue = `${fiatFormattedAmount} ${currentCurrency.toUpperCase()}`

  return {
    ethTransactionAmount,
    fiatDisplayValue,
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
