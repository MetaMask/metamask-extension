import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import { updateSend } from '../../../actions'
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction.duck'
import ConfirmSendEther from './confirm-send-ether.component'

const mapDispatchToProps = dispatch => {
  return {
    editTransaction: txData => {
      const { id, txParams } = txData
      const {
        gas: gasLimit,
        gasPrice,
        to,
        value: amount,
      } = txParams

      dispatch(updateSend({
        gasLimit,
        gasPrice,
        gasTotal: null,
        to,
        amount,
        errors: { to: null, amount: null },
        editingTransactionId: id && id.toString(),
      }))

      dispatch(clearConfirmTransaction())
    },
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(ConfirmSendEther)
