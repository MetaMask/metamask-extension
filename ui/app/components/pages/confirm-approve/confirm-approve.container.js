import { connect } from 'react-redux'
import ConfirmApprove from './confirm-approve.component'
import { approveTokenAmountAndToAddressSelector } from '../../../selectors/confirm-transaction'

const mapStateToProps = state => {
  const { tokenAmount } = approveTokenAmountAndToAddressSelector(state)

  return {
    tokenAmount,
  }
}

export default connect(mapStateToProps)(ConfirmApprove)
