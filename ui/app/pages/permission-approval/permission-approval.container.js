import { connect } from 'react-redux'
import PermissionApproval from './permission-approval.component'
import { approvePermissionRequest, rejectPermissionRequest } from '../../store/actions'

function mapDispatchToProps (dispatch) {
  return {
    approvePermissionRequest: requestId => dispatch(approvePermissionRequest(requestId)),
    rejectPermissionRequest: requestId => dispatch(rejectPermissionRequest(requestId)),
  }
}

export default connect(null, mapDispatchToProps)(PermissionApproval)
