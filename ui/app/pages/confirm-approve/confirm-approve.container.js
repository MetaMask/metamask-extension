import { connect } from 'react-redux'
import ConfirmApprove from './confirm-approve.component'
import { approveTokenAmountAndToAddressSelector } from '../../selectors/confirm-transaction'

const mapStateToProps = state => {
  const { confirmTransaction: { tokenProps: { tokenSymbol } = {} } } = state
  const { tokenAmount } = approveTokenAmountAndToAddressSelector(state)

  return {
    tokenAmount,
    tokenSymbol,
  }
}

export default connect(mapStateToProps)(ConfirmApprove)
