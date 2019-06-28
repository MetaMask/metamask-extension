import { connect } from 'react-redux'
import ConfirmTokenTransactionBase from './confirm-token-transaction-base.component'
import {
  contractExchangeRateSelector,
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


const mapStateToProps = (state) => {
  const { confirmTransaction, metamask: { currentCurrency, conversionRate } } = state
  const {
    txData: { txParams: { to: tokenAddress, data } = {} } = {},
    fiatTransactionTotal,
    ethTransactionTotal,
  } = confirmTransaction


  const tokens = tokenSelector(state)
  const currentToken = tokens && tokens.find(({ address }) => tokenAddress === address)
  const { decimals, symbol: tokenSymbol } = currentToken || {}

  const tokenData = getTokenData(data)
  const tokenValue = tokenData && getTokenValue(tokenData.params)
  const toAddress = tokenData && getTokenToAddress(tokenData.params)
  const tokenAmount = tokenData && calcTokenAmount(tokenValue, decimals).toString()
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

export default connect(mapStateToProps)(ConfirmTokenTransactionBase)
