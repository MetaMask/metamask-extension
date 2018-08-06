import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import withMethodData from '../../higher-order-components/with-method-data'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, retryTransaction } from '../../actions'
import { getEthFromWeiHex, getValueFromWeiHex } from '../../helpers/conversions.util'
import { getTokenData } from '../../helpers/transactions.util'
import { formatCurrency } from '../../helpers/confirm-transaction/util'
import { calcTokenAmount } from '../../token-util'
import { TOKEN_METHOD_TRANSFER } from '../../constants/transactions'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const { currentCurrency, conversionRate } = metamask
  const { transaction: { txParams: { value, data } = {} } = {}, token } = ownProps

  let ethTransactionAmount, fiatDisplayValue

  if (token) {
    const { decimals = '', symbol = '' } = token
    const tokenData = getTokenData(data)

    if (tokenData.params && tokenData.params.length === 2) {
      const tokenDataName = tokenData.name || ''
      const tokenValue = tokenData.params[1].value
      const tokenAmount = tokenDataName.toLowerCase() === TOKEN_METHOD_TRANSFER
        ? calcTokenAmount(tokenValue, decimals)
        : tokenValue

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
