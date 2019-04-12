import { connect } from 'react-redux'
import PermissionApproval from './permission-approval.component'
import { approvePermissionsRequest, rejectPermissionsRequest } from '../../store/actions'

function mapDispatchToProps (dispatch) {
  return {
    approvePermissionsRequest: requestId => dispatch(approvePermissionsRequest(requestId)),
    rejectPermissionsRequest: requestId => dispatch(rejectPermissionsRequest(requestId)),
  }
}

export default connect(null, mapDispatchToProps)(PermissionApproval)
