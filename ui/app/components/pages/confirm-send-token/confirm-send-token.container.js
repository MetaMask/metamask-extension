import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import ConfirmSendToken from './confirm-send-token.component'
import { calcTokenAmount } from '../../../token-util'
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction.duck'
import { setSelectedToken, updateSend, showSendTokenPage } from '../../../actions'
import { conversionUtil } from '../../../conversion-util'

const mapStateToProps = state => {
  const { confirmTransaction } = state
  const {
    tokenData = {},
    tokenProps: { tokenSymbol, tokenDecimals } = {},
    txData: { txParams: { to: tokenAddress } = {} } = {},
  } = confirmTransaction
  const { params = [] } = tokenData

  let toAddress = ''
  let tokenAmount = ''

  if (params && params.length === 2) {
    [{ value: toAddress }, { value: tokenAmount }] = params
  }

  const numberOfTokens = tokenAmount && tokenDecimals
    ? calcTokenAmount(tokenAmount, tokenDecimals)
    : 0

  return {
    toAddress,
    tokenAddress,
    tokenSymbol,
    numberOfTokens,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    editTransaction: ({ txData, tokenData, tokenProps }) => {
      const { txParams: { to: tokenAddress, gas: gasLimit, gasPrice } = {}, id } = txData
      const { params = [] } = tokenData
      const { value: to } = params[0] || {}
      const { value: tokenAmountInDec } = params[1] || {}
      const tokenAmountInHex = conversionUtil(tokenAmountInDec, {
        fromNumericBase: 'dec',
        toNumericBase: 'hex',
      })
      dispatch(setSelectedToken(tokenAddress))
      dispatch(updateSend({
        gasLimit,
        gasPrice,
        gasTotal: null,
        to,
        amount: tokenAmountInHex,
        errors: { to: null, amount: null },
        editingTransactionId: id && id.toString(),
        token: {
          ...tokenProps,
          address: tokenAddress,
        },
      }))
      dispatch(clearConfirmTransaction())
      dispatch(showSendTokenPage())
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmSendToken)
