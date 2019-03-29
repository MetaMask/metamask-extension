import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import ConfirmSendToken from './confirm-send-token.component'
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import { setSelectedToken, updateSend, showSendTokenPage } from '../../store/actions'
import { conversionUtil } from '../../helpers/utils/conversion-util'
import { sendTokenTokenAmountAndToAddressSelector } from '../../selectors/confirm-transaction'

const mapStateToProps = state => {
  const { tokenAmount } = sendTokenTokenAmountAndToAddressSelector(state)

  return {
    tokenAmount,
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
