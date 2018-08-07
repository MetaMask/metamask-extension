import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import withMethodData from '../../higher-order-components/with-method-data'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, retryTransaction } from '../../actions'
import { getEthFromWeiHex, getValueFromWeiHex, hexToDecimal } from '../../helpers/conversions.util'
import { getTokenData } from '../../helpers/transactions.util'
import { formatCurrency } from '../../helpers/confirm-transaction/util'
import { calcTokenAmount } from '../../token-util'
import { formatDate } from '../../util'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const { currentCurrency, conversionRate } = metamask
  const { transaction: { txParams: { value, data, nonce } = {}, time } = {}, token } = ownProps

  let ethTransactionAmount, fiatDisplayValue

  if (token) {
    const { decimals = '', symbol = '' } = token
    const tokenData = getTokenData(data)

    if (tokenData.params && tokenData.params.length === 2) {
      const tokenValue = tokenData.params[1].value
      const tokenAmount = calcTokenAmount(tokenValue, decimals)
      fiatDisplayValue = `${tokenAmount} ${symbol}`
    }
  } else {
    ethTransactionAmount = getEthFromWeiHex({ value, conversionRate })
    const fiatTransactionAmount = getValueFromWeiHex({
      value, conversionRate, toCurrency: currentCurrency, numberOfDecimals: 2,
    })
    const fiatFormattedAmount = formatCurrency(fiatTransactionAmount, currentCurrency)
    fiatDisplayValue = `${fiatFormattedAmount} ${currentCurrency.toUpperCase()}`
  }

  const nonceAndDate = nonce ? `#${hexToDecimal(nonce)} - ${formatDate(time)}` : formatDate(time)

  return {
    ethTransactionAmount,
    fiatDisplayValue,
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
