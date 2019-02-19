import { connect } from 'react-redux'
import ProviderApproval from './provider-approval.component'
import { approveProviderRequest, rejectProviderRequest } from '../../../actions'

function mapDispatchToProps (dispatch) {
  return {
    approveProviderRequest: requestId => dispatch(approveProviderRequest(requestId)),
    rejectProviderRequest: requestId => dispatch(rejectProviderRequest(requestId)),
  }
}

export default connect(null, mapDispatchToProps)(ProviderApproval)
