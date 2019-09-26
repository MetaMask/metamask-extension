import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import ConfirmTokenTransactionBase from './confirm-token-transaction-base.component'
import {
  contractExchangeRateSelector,
  transactionFeeSelector,
} from '../../selectors/confirm-transaction'
import { tokenSelector } from '../../selectors/tokens'
import {
  getTokenData,
} from '../../helpers/utils/transactions.util'
import {
  calcTokenAmount,
  getTokenToAddress,
  getTokenValue,
} from '../../helpers/utils/token-util'


const mapStateToProps = (state, ownProps) => {
  const { match: { params = {} } } = ownProps
  const { id: paramsTransactionId } = params
  const { confirmTransaction, metamask: { currentCurrency, conversionRate, selectedAddressTxList } } = state

  const {
    txData: { id: transactionId, txParams: { to: tokenAddress, data } = {} } = {},
  } = confirmTransaction

  const transaction = selectedAddressTxList.find(({ id }) => id === (Number(paramsTransactionId) || transactionId)) || {}

  const {
    ethTransactionTotal,
    fiatTransactionTotal,
  } = transactionFeeSelector(state, transaction)
  const tokens = tokenSelector(state)
  const currentToken = tokens && tokens.find(({ address }) => tokenAddress === address)
  const { decimals, symbol: tokenSymbol } = currentToken || {}

  const tokenData = getTokenData(data)
  const tokenValue = tokenData && getTokenValue(tokenData.params)
  const toAddress = tokenData && getTokenToAddress(tokenData.params)
  const tokenAmount = tokenData && calcTokenAmount(tokenValue, decimals).toNumber()
  const contractExchangeRate = contractExchangeRateSelector(state)

  return {
    toAddress,
    tokenAddress,
    tokenAmount,
    tokenSymbol,
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    ethTransactionTotal,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(ConfirmTokenTransactionBase)
